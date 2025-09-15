const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');

const router = express.Router();
const db = getDatabase();

// GET /api/volunteers - List all volunteers
router.get('/', async (req, res) => {
  try {
    const { skills, location, status = 'active' } = req.query;
    
    const volunteers = await db.getAvailableVolunteers(skills, location);
    
    // Filter by status if provided
    const filteredVolunteers = status ? volunteers.filter(v => v.status === status) : volunteers;
    
    res.json({
      success: true,
      data: filteredVolunteers,
      count: filteredVolunteers.length,
      filters: { skills, location, status }
    });
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteers'
    });
  }
});

// GET /api/volunteers/:id - Get specific volunteer
router.get('/:id', async (req, res) => {
  try {
    const volunteer = await db.findById('volunteers', req.params.id);
    
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    res.json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    console.error('Error fetching volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volunteer'
    });
  }
});

// POST /api/volunteers/register - Register new volunteer
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      skills,
      availability,
      location,
      latitude,
      longitude
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }

    // Check if email already exists
    const existingVolunteer = await db.findAll('volunteers', { email });
    if (existingVolunteer.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const volunteerData = {
      id: uuidv4(),
      name,
      email,
      phone,
      skills: skills || '',
      availability: availability || '',
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      status: 'active'
    };

    await db.create('volunteers', volunteerData);

    res.status(201).json({
      success: true,
      message: 'Volunteer registered successfully',
      data: volunteerData
    });
  } catch (error) {
    console.error('Error registering volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register volunteer'
    });
  }
});

// PUT /api/volunteers/:id - Update volunteer information
router.put('/:id', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const updateData = { ...req.body };
    
    // Remove id from update data if present
    delete updateData.id;

    // Convert numeric fields
    if (updateData.latitude) updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude) updateData.longitude = parseFloat(updateData.longitude);

    const updated = await db.update('volunteers', volunteerId, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const updatedVolunteer = await db.findById('volunteers', volunteerId);

    res.json({
      success: true,
      message: 'Volunteer updated successfully',
      data: updatedVolunteer
    });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update volunteer'
    });
  }
});

// PUT /api/volunteers/:id/status - Update volunteer status
router.put('/:id/status', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'busy'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const updated = await db.update('volunteers', volunteerId, { status });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const updatedVolunteer = await db.findById('volunteers', volunteerId);

    res.json({
      success: true,
      message: 'Volunteer status updated successfully',
      data: updatedVolunteer
    });
  } catch (error) {
    console.error('Error updating volunteer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update volunteer status'
    });
  }
});

// GET /api/volunteers/:id/assignments - Get volunteer's assigned requests
router.get('/:id/assignments', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    
    // Check if volunteer exists
    const volunteer = await db.findById('volunteers', volunteerId);
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const assignments = await db.findAll('emergency_requests', { 
      assigned_volunteer_id: volunteerId 
    });

    res.json({
      success: true,
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching volunteer assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assignments'
    });
  }
});

// POST /api/volunteers/:id/availability - Update volunteer availability
router.post('/:id/availability', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    const { availability, status } = req.body;

    const updateData = {};
    if (availability) updateData.availability = availability;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Either availability or status must be provided'
      });
    }

    const updated = await db.update('volunteers', volunteerId, updateData);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    const updatedVolunteer = await db.findById('volunteers', volunteerId);

    res.json({
      success: true,
      message: 'Volunteer availability updated successfully',
      data: updatedVolunteer
    });
  } catch (error) {
    console.error('Error updating volunteer availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability'
    });
  }
});

// GET /api/volunteers/match/:requestId - Find matching volunteers for a request
router.get('/match/:requestId', async (req, res) => {
  try {
    const requestId = req.params.requestId;
    
    // Get the emergency request
    const request = await db.findById('emergency_requests', requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Emergency request not found'
      });
    }

    // Get category information for skill matching
    let requiredSkills = '';
    if (request.category_id) {
      const category = await db.findById('categories', request.category_id);
      if (category) {
        // Simple skill mapping based on category
        const skillMapping = {
          'Healthcare': 'First Aid, Medical',
          'Transportation': 'Transportation, Driving',
          'Food Distribution': 'Food Service, General Help',
          'Emergency Services': 'First Aid, Emergency Response',
          'Mental Health': 'Counseling, Mental Health'
        };
        requiredSkills = skillMapping[category.name] || '';
      }
    }

    // Find available volunteers
    let matchingVolunteers = await db.getAvailableVolunteers();
    
    // Filter by active status
    matchingVolunteers = matchingVolunteers.filter(v => v.status === 'active');

    // Score volunteers based on various factors
    matchingVolunteers = matchingVolunteers.map(volunteer => {
      let score = 0;
      
      // Skill match scoring
      if (requiredSkills && volunteer.skills) {
        const volunteerSkills = volunteer.skills.toLowerCase();
        const requiredSkillsList = requiredSkills.toLowerCase().split(',');
        const matchingSkills = requiredSkillsList.filter(skill => 
          volunteerSkills.includes(skill.trim())
        );
        score += matchingSkills.length * 10;
      }

      // Location proximity scoring (simple)
      if (request.latitude && request.longitude && volunteer.latitude && volunteer.longitude) {
        const distance = Math.sqrt(
          Math.pow(request.latitude - volunteer.latitude, 2) + 
          Math.pow(request.longitude - volunteer.longitude, 2)
        );
        score += Math.max(0, 10 - distance * 10); // Closer is better
      }

      // Availability scoring
      if (volunteer.availability && volunteer.availability.toLowerCase().includes('flexible')) {
        score += 5;
      }

      return {
        ...volunteer,
        match_score: Math.round(score),
        matching_skills: requiredSkills
      };
    });

    // Sort by match score descending
    matchingVolunteers.sort((a, b) => b.match_score - a.match_score);

    // Return top 10 matches
    const topMatches = matchingVolunteers.slice(0, 10);

    res.json({
      success: true,
      data: topMatches,
      count: topMatches.length,
      request_info: {
        id: request.id,
        description: request.description,
        priority: request.priority,
        required_skills: requiredSkills
      }
    });
  } catch (error) {
    console.error('Error matching volunteers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to match volunteers'
    });
  }
});

// DELETE /api/volunteers/:id - Remove volunteer (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const volunteerId = req.params.id;
    
    // Soft delete by setting status to 'inactive'
    const updated = await db.update('volunteers', volunteerId, { status: 'inactive' });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Volunteer not found'
      });
    }

    res.json({
      success: true,
      message: 'Volunteer removed successfully'
    });
  } catch (error) {
    console.error('Error removing volunteer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove volunteer'
    });
  }
});

module.exports = router;