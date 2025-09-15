const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/resources', require('./routes/resources'));
app.use('/api/emergency-requests', require('./routes/emergencyRequests'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/categories', require('./routes/categories'));

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