const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

const router = express.Router();
const db = getDatabase();

// GET /api/resources - List all resources with optional filtering
router.get('/', async (req, res) => {
  try {
    const filters = {
      category_id: req.query.category,
      search: req.query.search,
      latitude: req.query.lat ? parseFloat(req.query.lat) : null,
      longitude: req.query.lng ? parseFloat(req.query.lng) : null,
      radius: req.query.radius ? parseFloat(req.query.radius) : null
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    const resources = await db.searchResources(filters);
    
    res.json({
      success: true,
      data: resources,
      count: resources.length,
      filters: filters
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources'
    });
  }
});

// GET /api/resources/:id - Get specific resource
router.get('/:id', async (req, res) => {
  try {
    const resource = await db.findById('resources', req.params.id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Get category information
    if (resource.category_id) {
      const category = await db.findById('categories', resource.category_id);
      resource.category = category;
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource'
    });
  }
});

// POST /api/resources - Create new resource
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      address,
      latitude,
      longitude,
      phone,
      email,
      website,
      operating_hours,
      capacity,
      current_availability
    } = req.body;

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Name and address are required'
      });
    }

    const resourceData = {
      id: uuidv4(),
      name,
      description,
      category_id,
      address,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phone,
      email,
      website,
      operating_hours,
      capacity: capacity ? parseInt(capacity) : null,
      current_availability: current_availability ? parseInt(current_availability) : null,
      status: 'active'
    };

    await db.create('resources', resourceData);

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      data: resourceData
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create resource'
    });
  }
});

// PUT /api/resources/:id - Update resource
router.put('/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const updateData = { ...req.body };
    
    // Remove id from update data if present
    delete updateData.id;

    // Convert numeric fields
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.capacity) updateData.capacity = parseInt(updateData.capacity);
    if (updateData.current_availability) updateData.current_availability = parseInt(updateData.current_availability);

    const updated = await db.update('resources', resourceId, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    const updatedResource = await db.findById('resources', resourceId);

    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource'
    });
  }
});

// DELETE /api/resources/:id - Delete resource (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const resourceId = req.params.id;
    
    // Soft delete by setting status to 'inactive'
    const updated = await db.update('resources', resourceId, { status: 'inactive' });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource'
    });
  }
});

// POST /api/resources/:id/update-availability - Update resource availability
router.post('/:id/update-availability', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { current_availability } = req.body;

    if (current_availability === undefined || current_availability === null) {
      return res.status(400).json({
        success: false,
        error: 'current_availability is required'
      });
    }

    const updated = await db.update('resources', resourceId, {
      current_availability: parseInt(current_availability)
    });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    const updatedResource = await db.findById('resources', resourceId);

    // Emit real-time update (assuming socket.io is available)
    if (req.app.get('io')) {
      req.app.get('io').emit('resource-updated', {
        id: resourceId,
        current_availability: parseInt(current_availability),
        resource: updatedResource
      });
    }

    res.json({
      success: true,
      message: 'Resource availability updated successfully',
      data: updatedResource
    });
  } catch (error) {
    console.error('Error updating resource availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource availability'
    });
  }
});

module.exports = router;