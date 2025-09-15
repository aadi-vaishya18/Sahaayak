# Community Resource Dashboard API Documentation

## Overview

The Community Resource Dashboard API provides endpoints for managing community resources, emergency requests, volunteers, and categories. This RESTful API supports real-time updates through WebSocket connections.

**Base URL:** `http://localhost:3001/api`

## Authentication

Currently, the API does not implement authentication for the MVP version. In production, you should implement proper authentication and authorization mechanisms.

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": [...],
  "count": 10,
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Health Check

### GET /health

Check the health status of the API.

**Response:**
```json
{
  "status": "OK",
  "message": "Community Resource Dashboard API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## Categories

### GET /categories

Retrieve all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Healthcare",
      "description": "Hospitals, clinics, and medical services",
      "icon": "🏥",
      "color": "#e74c3c",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 6
}
```

### GET /categories/:id

Retrieve a specific category with statistics.

**Parameters:**
- `id` (string): Category ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Healthcare",
    "description": "Hospitals, clinics, and medical services",
    "icon": "🏥",
    "color": "#e74c3c",
    "stats": {
      "resources": 5,
      "requests": 12,
      "active_requests": 3
    }
  }
}
```

### GET /categories/:id/resources

Get all resources in a specific category.

### GET /categories/:id/requests

Get all emergency requests in a specific category.

## Resources

### GET /resources

Retrieve all resources with optional filtering.

**Query Parameters:**
- `category` (string): Filter by category ID
- `search` (string): Search in name and description
- `lat` (float): Latitude for location-based search
- `lng` (float): Longitude for location-based search
- `radius` (float): Search radius in kilometers

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "City General Hospital",
      "description": "24/7 emergency services and general healthcare",
      "category_id": "uuid",
      "category_name": "Healthcare",
      "category_icon": "🏥",
      "category_color": "#e74c3c",
      "address": "123 Main St, Downtown",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "phone": "+1-555-0123",
      "email": "info@citygeneral.com",
      "website": "https://citygeneral.com",
      "operating_hours": "24/7",
      "capacity": 200,
      "current_availability": 45,
      "status": "active",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 5,
  "filters": {
    "category": "uuid",
    "search": "hospital"
  }
}
```

### GET /resources/:id

Retrieve a specific resource.

### POST /resources

Create a new resource.

**Request Body:**
```json
{
  "name": "New Resource",
  "description": "Resource description",
  "category_id": "uuid",
  "address": "123 Address St",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "phone": "+1-555-0123",
  "email": "contact@resource.com",
  "website": "https://resource.com",
  "operating_hours": "9AM-5PM",
  "capacity": 50,
  "current_availability": 25
}
```

### PUT /resources/:id

Update an existing resource.

### DELETE /resources/:id

Soft delete a resource (sets status to 'inactive').

### POST /resources/:id/update-availability

Update resource availability.

**Request Body:**
```json
{
  "current_availability": 30
}
```

## Emergency Requests

### GET /emergency-requests

Retrieve all emergency requests with details.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requester_name": "John Doe",
      "requester_phone": "+1-555-0100",
      "requester_email": "john@email.com",
      "description": "Need medical assistance urgently",
      "category_id": "uuid",
      "category_name": "Healthcare",
      "category_icon": "🏥",
      "category_color": "#e74c3c",
      "location": "Downtown area",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "priority": "high",
      "status": "open",
      "assigned_volunteer_id": null,
      "volunteer_name": null,
      "volunteer_phone": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 10
}
```

### GET /emergency-requests/:id

Retrieve a specific emergency request.

### POST /emergency-requests

Submit a new emergency request.

**Request Body:**
```json
{
  "requester_name": "John Doe",
  "requester_phone": "+1-555-0100",
  "requester_email": "john@email.com",
  "description": "Need immediate medical assistance",
  "category_id": "uuid",
  "location": "Downtown area",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Emergency request submitted successfully",
  "data": {
    "id": "uuid",
    "requester_name": "John Doe",
    "description": "Need immediate medical assistance",
    "priority": "high",
    "status": "open"
  },
  "priority_assigned": "high"
}
```

### PUT /emergency-requests/:id/status

Update request status.

**Request Body:**
```json
{
  "status": "in-progress",
  "assigned_volunteer_id": "uuid",
  "notes": "Volunteer assigned and en route"
}
```

### PUT /emergency-requests/:id/assign

Assign a volunteer to a request.

**Request Body:**
```json
{
  "volunteer_id": "uuid"
}
```

### DELETE /emergency-requests/:id

Delete an emergency request.

## Volunteers

### GET /volunteers

Retrieve all volunteers with optional filtering.

**Query Parameters:**
- `skills` (string): Filter by skills
- `location` (string): Filter by location
- `status` (string): Filter by status (default: 'active')

### GET /volunteers/:id

Retrieve a specific volunteer.

### POST /volunteers/register

Register a new volunteer.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@email.com",
  "phone": "+1-555-0200",
  "skills": "First Aid, Transportation",
  "availability": "Weekends",
  "location": "Downtown",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### PUT /volunteers/:id

Update volunteer information.

### PUT /volunteers/:id/status

Update volunteer status.

**Request Body:**
```json
{
  "status": "active"
}
```

### POST /volunteers/:id/availability

Update volunteer availability.

**Request Body:**
```json
{
  "availability": "Flexible schedule",
  "status": "active"
}
```

### GET /volunteers/:id/assignments

Get volunteer's assigned requests.

### GET /volunteers/match/:requestId

Find matching volunteers for an emergency request.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@email.com",
      "skills": "First Aid, Transportation",
      "match_score": 85,
      "matching_skills": "First Aid, Medical"
    }
  ],
  "count": 3,
  "request_info": {
    "id": "uuid",
    "description": "Medical emergency",
    "priority": "high",
    "required_skills": "First Aid, Medical"
  }
}
```

### DELETE /volunteers/:id

Remove a volunteer (soft delete).

## Statistics

### GET /emergency-requests/stats

Get system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalResources": 15,
    "totalRequests": 8,
    "totalVolunteers": 12,
    "highPriorityRequests": 2
  }
}
```

## Real-time Events (WebSocket)

The API supports real-time updates through WebSocket connections on the same port.

### Connection

Connect to: `ws://localhost:3001`

### Events

#### Client to Server

- `join-admin`: Join admin room to receive all notifications
- `join-volunteer`: Join volunteer room (requires volunteer ID)
- `emergency-update`: Send emergency request update
- `resource-update`: Send resource update

#### Server to Client

- `new-emergency`: New emergency request submitted
- `resource-updated`: Resource information updated
- `request-status-updated`: Request status changed
- `request-assigned`: Volunteer assigned to request

### Example WebSocket Usage

```javascript
const socket = io('http://localhost:3001');

// Join admin room
socket.emit('join-admin');

// Listen for new emergency requests
socket.on('new-emergency', (data) => {
  console.log('New emergency request:', data);
});

// Listen for resource updates
socket.on('resource-updated', (data) => {
  console.log('Resource updated:', data);
});
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- 100 requests per 15 minutes per IP address
- Higher limits for local development

## Priority Categorization

Emergency requests are automatically categorized by priority based on keywords:

**High Priority Keywords:**
- emergency, urgent, critical, life-threatening, immediate
- ambulance, fire, bleeding, unconscious, severe, accident

**Low Priority Keywords:**
- information, question, routine, schedule, appointment
- general, inquiry, non-urgent

**Default:** Medium priority

## Data Types

### Priority Levels
- `high` - Requires immediate attention
- `medium` - Standard priority (default)
- `low` - Can be handled when resources are available

### Status Values

**Resource Status:**
- `active` - Available for use
- `inactive` - Temporarily unavailable

**Request Status:**
- `open` - Newly submitted, awaiting assignment
- `in-progress` - Assigned to volunteer, being handled
- `resolved` - Successfully completed
- `closed` - Closed without resolution

**Volunteer Status:**
- `active` - Available for assignments
- `inactive` - Not available
- `busy` - Currently assigned to a request

## Development

### Testing the API

Use tools like Postman, curl, or HTTPie to test endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Get all resources
curl http://localhost:3001/api/resources

# Submit emergency request
curl -X POST http://localhost:3001/api/emergency-requests \
  -H "Content-Type: application/json" \
  -d '{
    "requester_name": "Test User",
    "description": "Test emergency request",
    "category_id": "uuid"
  }'
```

### Database Schema

The API uses SQLite with the following tables:
- `categories` - Resource categories
- `resources` - Community resources
- `emergency_requests` - Emergency help requests
- `volunteers` - Registered volunteers

See the database initialization script for detailed schema information.

## Deployment

The API can be deployed using Docker:

```bash
# Build and start
docker-compose up -d

# Initialize database
docker-compose run --rm database-init

# View logs
docker-compose logs -f backend
```

## Future Enhancements

- Authentication and authorization
- Advanced search capabilities
- Notification systems (email, SMS)
- Analytics and reporting
- Mobile app API support
- Voice-to-text integration
- Multi-language support