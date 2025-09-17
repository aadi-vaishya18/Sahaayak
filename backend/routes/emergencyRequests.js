const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

const router = express.Router();
const db = getDatabase();

// Priority levels for automatic categorization
const categorizePriority = (description, category) => {
  const highPriorityKeywords = [
    'emergency', 'urgent', 'critical', 'life-threatening', 'immediate', 
    'ambulance', 'fire', 'bleeding', 'unconscious', 'severe', 'accident'
  ];
  
  const lowPriorityKeywords = [
    'information', 'question', 'routine', 'schedule', 'appointment',
    'general', 'inquiry', 'non-urgent'
  ];

  const text = description.toLowerCase();
  
  // Check for high priority keywords
  if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
    return 'high';
  }
  
  // Emergency services category defaults to high priority
  if (category && category.toLowerCase().includes('emergency')) {
    return 'high';
  }
  
  // Check for low priority keywords
  if (lowPriorityKeywords.some(keyword => text.includes(keyword))) {
    return 'low';
  }
  
  // Default to medium priority
  return 'medium';
};

// GET /api/emergency-requests - List all emergency requests
router.get('/', async (req, res) => {
  try {
    const requests = await db.getEmergencyRequestsWithDetails();
    
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching emergency requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency requests'
    });
  }
});

// GET /api/emergency-requests/stats - Get emergency request statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.getResourceStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching emergency request stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// GET /api/emergency-requests/:id - Get specific emergency request
router.get('/:id', async (req, res) => {
  try {
    const request = await db.findById('emergency_requests', req.params.id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found'
      });
    }

    // Get additional details
    if (request.category_id) {
      const category = await db.findById('categories', request.category_id);
      request.category = category;
    }

    if (request.assigned_volunteer_id) {
      const volunteer = await db.findById('volunteers', request.assigned_volunteer_id);
      request.assigned_volunteer = volunteer;
    }

    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching emergency request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency request'
    });
  }
});

// POST /api/emergency-requests - Submit new emergency request
router.post('/', async (req, res) => {
  try {
    const {
      requester_name,
      requester_phone,
      requester_email,
      description,
      category_id,
      location,
      latitude,
      longitude,
      priority
    } = req.body;

    // Validate required fields
    if (!requester_name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Requester name and description are required'
      });
    }

    // Get category name for priority calculation
    let categoryName = '';
    if (category_id) {
      const category = await db.findById('categories', category_id);
      categoryName = category ? category.name : '';
    }

    // Auto-categorize priority if not provided
    const finalPriority = priority || categorizePriority(description, categoryName);

    const requestData = {
      id: uuidv4(),
      requester_name,
      requester_phone,
      requester_email,
      description,
      category_id,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      priority: finalPriority,
      status: 'open'
    };

    await db.create('emergency_requests', requestData);

    // Emit real-time update for new emergency request
    if (req.app.get('io')) {
      req.app.get('io').to('admin').emit('new-emergency', {
        ...requestData,
        category_name: categoryName
      });
    }

    res.status(201).json({
      success: true,
      message: 'Emergency request submitted successfully',
      data: requestData,
      priority_assigned: finalPriority
    });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit emergency request'
    });
  }
});

// PUT /api/emergency-requests/:id/status - Update request status
router.put('/:id/status', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { status, assigned_volunteer_id, notes } = req.body;

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const updateData = { status };
    if (assigned_volunteer_id) {
      updateData.assigned_volunteer_id = assigned_volunteer_id;
    }
    if (notes) {
      updateData.notes = notes;
    }

    const updated = await db.update('emergency_requests', requestId, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found'
      });
    }

    const updatedRequest = await db.findById('emergency_requests', requestId);

    // Emit real-time update for status change
    if (req.app.get('io')) {
      req.app.get('io').emit('request-status-updated', {
        id: requestId,
        status,
        request: updatedRequest
      });
    }

    res.json({
      success: true,
      message: 'Request status updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request status'
    });
  }
});

// PUT /api/emergency-requests/:id/assign - Assign volunteer to request
router.put('/:id/assign', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { volunteer_id } = req.body;

    if (!volunteer_id) {
      return res.status(400).json({
        success: false,
        error: 'volunteer_id is required'
      });
    }

    // Check if volunteer exists and is active
    const volunteer = await db.findById('volunteers', volunteer_id);
    if (!volunteer || volunteer.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Volunteer not found or inactive'
      });
    }

    const updated = await db.update('emergency_requests', requestId, {
      assigned_volunteer_id: volunteer_id,
      status: 'in-progress'
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found'
      });
    }

    const updatedRequest = await db.findById('emergency_requests', requestId);

    // Notify volunteer about assignment
    if (req.app.get('io')) {
      req.app.get('io').to(`volunteer-${volunteer_id}`).emit('request-assigned', {
        request: updatedRequest,
        volunteer: volunteer
      });
    }

    res.json({
      success: true,
      message: 'Volunteer assigned successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error assigning volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign volunteer'
    });
  }
});

// DELETE /api/emergency-requests/:id - Delete emergency request
router.delete('/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    
    const deleted = await db.delete('emergency_requests', requestId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting emergency request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete emergency request'
    });
  }
});

module.exports = router;