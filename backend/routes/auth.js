const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../models/database');

const router = express.Router();
const db = getDatabase();

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'community-resource-dashboard-secret-key-2024';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Default admin credentials (in production, these should be properly set up)
const DEFAULT_ADMIN = {
  email: 'admin@community.gov.in',
  password: 'admin123', // This will be hashed
  name: 'System Administrator',
  role: 'admin'
};

// Initialize admin user if not exists
const initializeAdminUser = async () => {
  try {
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [DEFAULT_ADMIN.email]);
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
      const adminData = {
        id: uuidv4(),
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
        status: 'active',
        last_login: null
      };
      
      await db.create('users', adminData);
      console.log('Default admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error);
    // Create the users table if it doesn't exist
    try {
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          status TEXT DEFAULT 'active',
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Try creating admin user again
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
      const adminData = {
        id: uuidv4(),
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
        status: 'active',
        last_login: null
      };
      
      await db.create('users', adminData);
      console.log('Default admin user created successfully after table creation');
    } catch (secondError) {
      console.error('Failed to create users table or admin user:', secondError);
    }
  }
};

// Call initialization
initializeAdminUser();

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

// POST /api/auth/login - Admin login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await db.get('SELECT * FROM users WHERE email = ? AND status = "active"', [email]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    await db.update('users', user.id, { last_login: new Date().toISOString() });

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: JWT_EXPIRY
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// POST /api/auth/register - Register new admin user (protected route)
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('role').isIn(['admin', 'supervisor']).withMessage('Role must be admin or supervisor')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      role,
      status: 'active'
    };

    await db.create('users', userData);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get current user data
    const user = await db.get('SELECT id, email, name, role, status, created_at, last_login FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// PUT /api/auth/change-password - Change user password
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.update('users', user.id, { password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

module.exports = router;