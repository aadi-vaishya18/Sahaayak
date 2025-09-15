# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **Community Resource Dashboard** built for AICTE MIC-Student Innovation - a full-stack web application that connects citizens with essential community resources like healthcare, shelters, food distribution centers, and emergency services. The system provides real-time mapping, emergency request handling, volunteer coordination, and administrative oversight.

## Architecture & Technology Stack

### Backend Architecture
- **Framework**: Node.js with Express.js
- **Database**: SQLite (development/MVP), PostgreSQL-ready (production)
- **Real-time**: WebSocket implementation using Socket.io
- **API Design**: RESTful API with comprehensive CRUD operations

### Frontend Architecture  
- **Type**: Static web application (vanilla HTML/CSS/JavaScript)
- **Mapping**: Leaflet.js with OpenStreetMap integration
- **Real-time**: Socket.io client for live updates
- **Responsive**: Mobile-first design

### Key Components

#### Backend (`backend/`)
- `server.js` - Main Express server with Socket.io integration
- `models/database.js` - Database abstraction layer with generic CRUD and specialized queries
- `routes/` - API endpoints: resources, emergency-requests, volunteers, categories
- `scripts/initDatabase.js` - Database schema and sample data initialization

#### Frontend (`frontend/`)
- `js/app.js` - Main application controller with section management
- `js/api.js` - API communication layer with error handling
- `js/map.js` - Leaflet map integration with resource markers
- `js/realtime.js` - Socket.io client for real-time updates

### Database Schema
The system uses a relational model with these core entities:
- **Categories** - Resource types (healthcare, shelters, food, emergency services)
- **Resources** - Physical community resources with location data
- **Emergency Requests** - Citizen requests with automatic priority assignment
- **Volunteers** - Community volunteers with skills and availability

## Development Commands

### Backend Development
```bash
# Development setup
cd backend
npm install
npm run db:init     # Initialize SQLite database with sample data
npm run dev         # Start development server with nodemon

# Production
npm start           # Start production server

# Testing
npm test           # Run Jest test suite
```

### Frontend Development
The frontend is static files - no build process required.

```bash
# Serve frontend locally
cd frontend
python -m http.server 3000
# OR
npx serve . -p 3000
```

### Docker Development
```bash
# Full stack deployment
docker-compose up -d

# Initialize database in Docker
docker-compose run --rm database-init

# Deployment script (Unix/Mac)
chmod +x scripts/deploy.sh
./scripts/deploy.sh          # Deploy
./scripts/deploy.sh stop     # Stop services
./scripts/deploy.sh logs     # View logs
./scripts/deploy.sh init-db  # Initialize database
```

### Testing
```bash
# Run backend API tests
cd backend
npm test

# Test specific endpoints manually
curl http://localhost:3001/api/health
curl http://localhost:3001/api/resources
```

## Key Architectural Patterns

### Database Layer (`models/database.js`)
- **Singleton Pattern**: Single database instance across the application
- **Generic CRUD**: Reusable create, read, update, delete operations for any table
- **Specialized Queries**: Custom methods for complex operations like `searchResources()`, `getEmergencyRequestsWithDetails()`
- **Promise-based**: All database operations return promises for async/await usage

### API Layer (`routes/`)
- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Consistent Response Format**: All endpoints return `{success, data, count, message}` format
- **Error Handling**: Centralized error responses with development vs production modes
- **Input Validation**: Required field validation and type conversion

### Real-time System
- **Socket.io Rooms**: Separate rooms for admins (`admin`) and volunteers (`volunteer-{id}`)
- **Event Broadcasting**: Emergency requests broadcast to admin room, resource updates to all clients
- **Connection Management**: Client join/leave room handling

### Frontend State Management (`app.js`)
- **Section-based Navigation**: Single-page application with tab-based sections
- **Centralized State**: App class manages all application state (resources, requests, volunteers)
- **Event-driven**: Custom events for map interactions and real-time updates
- **Filter System**: Dynamic resource filtering by category, search, and location

## Priority Assignment Logic
Emergency requests automatically receive priority based on keywords:
- **High Priority**: "urgent", "emergency", "critical", "ambulance", "fire", "police"
- **Low Priority**: "information", "routine", "non-urgent", "question"
- **Medium Priority**: Default for all other requests

## Map Integration
- **Resource Markers**: Color-coded by category with popup details
- **User Location**: Blue marker showing current position
- **Interactive**: Click events for resource selection and location picking
- **Responsive**: Mobile-optimized touch interactions

## Socket.io Events
- `join-admin` - Admin dashboard real-time updates
- `join-volunteer` - Volunteer-specific notifications
- `emergency-update` - New emergency requests
- `resource-update` - Resource availability changes

## Environment Configuration
```bash
# Backend .env file
NODE_ENV=development
PORT=3001
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:3000
```

## Common Development Patterns

### Adding New API Endpoints
1. Create route handler in appropriate `routes/` file
2. Use database methods from `models/database.js`
3. Follow consistent response format
4. Add input validation
5. Update API documentation in `docs/API.md`

### Adding New Frontend Features
1. Add UI elements to `index.html`
2. Implement feature logic in `app.js`
3. Add API calls to `api.js` if needed
4. Update event listeners in `setupEventListeners()`
5. Add real-time updates if applicable

### Database Schema Changes
1. Modify `scripts/initDatabase.js` for schema updates
2. Update database methods in `models/database.js`
3. Ensure backward compatibility for existing data
4. Add migration logic if needed

## Service Architecture
- **Backend**: Port 3001, handles API requests and WebSocket connections
- **Frontend**: Port 3000, serves static files and connects to backend
- **Database**: SQLite file in backend directory
- **Docker**: Orchestrated services with health checks and volume mounts