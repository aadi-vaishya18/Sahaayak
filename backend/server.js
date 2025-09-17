const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { authenticateToken, authorizeRoles } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:5500", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", "http://127.0.0.1:3002", "http://localhost:5500", "http://127.0.0.1:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(limiter);
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/resources', require('./routes/resources'));
app.use('/api/emergency-requests', require('./routes/emergencyRequests'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/categories', require('./routes/categories'));

// Admin only routes (uncomment when implementing admin-specific functionality)
// app.use('/api/admin', authenticateToken, authorizeRoles('admin'), require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Community Resource Dashboard API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Community Resource Dashboard API',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join volunteer room
  socket.on('join-volunteer', (volunteerId) => {
    socket.join(`volunteer-${volunteerId}`);
    console.log(`Volunteer ${volunteerId} joined room`);
  });

  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('Admin joined room');
  });

  // Handle emergency request updates
  socket.on('emergency-update', (data) => {
    socket.to('admin').emit('new-emergency', data);
    console.log('Emergency update broadcasted to admins');
  });

  // Handle resource updates
  socket.on('resource-update', (data) => {
    socket.broadcast.emit('resource-updated', data);
    console.log('Resource update broadcasted');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Community Resource Dashboard API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
});