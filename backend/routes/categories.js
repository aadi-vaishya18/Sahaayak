const express = require('express');
const { getDatabase } = require('../models/database');

const router = express.Router();
const db = getDatabase();

// GET /api/categories - List all categories
router.get('/', async (req, res) => {
  try {
    const categories = await db.findAll('categories');
    
    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// GET /api/categories/:id - Get specific category
router.get('/:id', async (req, res) => {
  try {
    const category = await db.findById('categories', req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Get category statistics
    const resourceCount = await db.findAll('resources', { 
      category_id: req.params.id, 
      status: 'active' 
    });
    
    const requestCount = await db.findAll('emergency_requests', { 
      category_id: req.params.id 
    });

    const categoryWithStats = {
      ...category,
      stats: {
        resources: resourceCount.length,
        requests: requestCount.length,
        active_requests: requestCount.filter(r => r.status === 'open' || r.status === 'in-progress').length
      }
    };

    res.json({
      success: true,
      data: categoryWithStats
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

// GET /api/categories/:id/resources - Get all resources in a category
router.get('/:id/resources', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category exists
    const category = await db.findById('categories', categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const resources = await db.searchResources({ category_id: categoryId });
    
    res.json({
      success: true,
      data: resources,
      count: resources.length,
      category: category
    });
  } catch (error) {
    console.error('Error fetching category resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category resources'
    });
  }
});

// GET /api/categories/:id/requests - Get all emergency requests in a category
router.get('/:id/requests', async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if category exists
    const category = await db.findById('categories', categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    const requests = await db.findAll('emergency_requests', { category_id: categoryId });
    
    res.json({
      success: true,
      data: requests,
      count: requests.length,
      category: category
    });
  } catch (error) {
    console.error('Error fetching category requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category requests'
    });
  }
});

module.exports = router;