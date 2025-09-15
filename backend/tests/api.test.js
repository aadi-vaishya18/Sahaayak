const request = require('supertest');
const path = require('path');

// Mock the database path for testing
process.env.DATABASE_PATH = path.join(__dirname, 'test_database.sqlite');

const app = require('../server');
const { getDatabase } = require('../models/database');

describe('Community Resource Dashboard API', () => {
  let server;
  let db;

  beforeAll(async () => {
    // Initialize test database
    db = getDatabase();
    
    // Start server
    server = app.listen(3002);
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
    if (server) {
      server.close();
    }
  });

  describe('Health Check', () => {
    test('GET /api/health should return OK status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        message: 'Community Resource Dashboard API is running',
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Categories API', () => {
    test('GET /api/categories should return categories list', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      
      if (response.body.data.length > 0) {
        const category = response.body.data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
      }
    });

    test('GET /api/categories/:id should return specific category', async () => {
      // First get all categories to get a valid ID
      const categoriesResponse = await request(app).get('/api/categories');
      const categories = categoriesResponse.body.data;
      
      if (categories.length > 0) {
        const categoryId = categories[0].id;
        
        const response = await request(app)
          .get(`/api/categories/${categoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id', categoryId);
        expect(response.body.data).toHaveProperty('stats');
      }
    });

    test('GET /api/categories/invalid-id should return 404', async () => {
      const response = await request(app)
        .get('/api/categories/invalid-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Category not found');
    });
  });

  describe('Resources API', () => {
    test('GET /api/resources should return resources list', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('filters');
    });

    test('GET /api/resources with category filter should work', async () => {
      // Get categories first
      const categoriesResponse = await request(app).get('/api/categories');
      const categories = categoriesResponse.body.data;
      
      if (categories.length > 0) {
        const categoryId = categories[0].id;
        
        const response = await request(app)
          .get(`/api/resources?category=${categoryId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.filters.category_id).toBe(categoryId);
      }
    });

    test('GET /api/resources with search filter should work', async () => {
      const response = await request(app)
        .get('/api/resources?search=hospital')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.search).toBe('hospital');
    });

    test('POST /api/resources should create new resource', async () => {
      const categoriesResponse = await request(app).get('/api/categories');
      const categories = categoriesResponse.body.data;
      
      if (categories.length > 0) {
        const newResource = {
          name: 'Test Resource',
          description: 'A test resource for API testing',
          category_id: categories[0].id,
          address: '123 Test Street, Test City',
          phone: '+1-555-TEST',
          email: 'test@testresource.com',
          operating_hours: '9AM-5PM',
          capacity: 100,
          current_availability: 50
        };

        const response = await request(app)
          .post('/api/resources')
          .send(newResource)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Resource created successfully');
        expect(response.body.data).toMatchObject({
          name: newResource.name,
          description: newResource.description,
          address: newResource.address
        });
      }
    });

    test('POST /api/resources without required fields should return 400', async () => {
      const invalidResource = {
        description: 'Missing required name field'
      };

      const response = await request(app)
        .post('/api/resources')
        .send(invalidResource)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Name and address are required');
    });
  });

  describe('Emergency Requests API', () => {
    test('GET /api/emergency-requests should return requests list', async () => {
      const response = await request(app)
        .get('/api/emergency-requests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });

    test('POST /api/emergency-requests should create new request', async () => {
      const newRequest = {
        requester_name: 'Test User',
        requester_phone: '+1-555-TEST',
        requester_email: 'test@test.com',
        description: 'This is a test emergency request for urgent medical assistance',
        location: 'Test Location'
      };

      const response = await request(app)
        .post('/api/emergency-requests')
        .send(newRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Emergency request submitted successfully');
      expect(response.body.data).toMatchObject({
        requester_name: newRequest.requester_name,
        description: newRequest.description
      });
      expect(response.body.priority_assigned).toBeDefined();
    });

    test('POST /api/emergency-requests should auto-assign high priority for urgent keywords', async () => {
      const urgentRequest = {
        requester_name: 'Emergency User',
        description: 'URGENT: Need immediate ambulance assistance, this is critical',
        location: 'Emergency Location'
      };

      const response = await request(app)
        .post('/api/emergency-requests')
        .send(urgentRequest)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.priority_assigned).toBe('high');
    });

    test('POST /api/emergency-requests without required fields should return 400', async () => {
      const invalidRequest = {
        description: 'Missing requester name'
      };

      const response = await request(app)
        .post('/api/emergency-requests')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Requester name and description are required');
    });
  });

  describe('Volunteers API', () => {
    let testVolunteerId;

    test('GET /api/volunteers should return volunteers list', async () => {
      const response = await request(app)
        .get('/api/volunteers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });

    test('POST /api/volunteers/register should register new volunteer', async () => {
      const newVolunteer = {
        name: 'Test Volunteer',
        email: 'volunteer@test.com',
        phone: '+1-555-VOLUNTEER',
        skills: 'First Aid, Transportation',
        availability: 'Weekends',
        location: 'Test City'
      };

      const response = await request(app)
        .post('/api/volunteers/register')
        .send(newVolunteer)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Volunteer registered successfully');
      expect(response.body.data).toMatchObject({
        name: newVolunteer.name,
        email: newVolunteer.email,
        skills: newVolunteer.skills
      });

      // Save ID for later tests
      testVolunteerId = response.body.data.id;
    });

    test('POST /api/volunteers/register with duplicate email should return 400', async () => {
      const duplicateVolunteer = {
        name: 'Another Volunteer',
        email: 'volunteer@test.com', // Same email as above
        phone: '+1-555-DUPLICATE'
      };

      const response = await request(app)
        .post('/api/volunteers/register')
        .send(duplicateVolunteer)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already registered');
    });

    test('POST /api/volunteers/register without required fields should return 400', async () => {
      const invalidVolunteer = {
        phone: '+1-555-INVALID'
        // Missing name and email
      };

      const response = await request(app)
        .post('/api/volunteers/register')
        .send(invalidVolunteer)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Name and email are required');
    });

    test('PUT /api/volunteers/:id/status should update volunteer status', async () => {
      if (testVolunteerId) {
        const response = await request(app)
          .put(`/api/volunteers/${testVolunteerId}/status`)
          .send({ status: 'busy' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Volunteer status updated successfully');
        expect(response.body.data.status).toBe('busy');
      }
    });
  });

  describe('Statistics API', () => {
    test('GET /api/emergency-requests/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/emergency-requests/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalResources');
      expect(response.body.data).toHaveProperty('totalRequests');
      expect(response.body.data).toHaveProperty('totalVolunteers');
      expect(response.body.data).toHaveProperty('highPriorityRequests');
      
      // Check that all values are numbers
      expect(typeof response.body.data.totalResources).toBe('number');
      expect(typeof response.body.data.totalRequests).toBe('number');
      expect(typeof response.body.data.totalVolunteers).toBe('number');
      expect(typeof response.body.data.highPriorityRequests).toBe('number');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('The requested resource was not found');
    });

    test('POST /api/resources with malformed JSON should return 400', async () => {
      const response = await request(app)
        .post('/api/resources')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Should handle malformed JSON gracefully
    });
  });

  describe('CORS Headers', () => {
    test('OPTIONS request should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/resources')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Priority Categorization Logic', () => {
    test('Should assign high priority for emergency keywords', async () => {
      const highPriorityKeywords = [
        'emergency', 'urgent', 'critical', 'life-threatening', 
        'immediate', 'ambulance', 'fire', 'bleeding'
      ];

      for (const keyword of highPriorityKeywords.slice(0, 3)) { // Test first 3
        const request = {
          requester_name: 'Test User',
          description: `Need help, this is ${keyword} situation`
        };

        const response = await request(app)
          .post('/api/emergency-requests')
          .send(request)
          .expect(201);

        expect(response.body.priority_assigned).toBe('high');
      }
    });

    test('Should assign low priority for routine keywords', async () => {
      const request = {
        requester_name: 'Test User',
        description: 'Just a general information question, non-urgent inquiry'
      };

      const response = await request(app)
        .post('/api/emergency-requests')
        .send(request)
        .expect(201);

      expect(response.body.priority_assigned).toBe('low');
    });

    test('Should assign medium priority by default', async () => {
      const request = {
        requester_name: 'Test User',
        description: 'Need some help with community resources'
      };

      const response = await request(app)
        .post('/api/emergency-requests')
        .send(request)
        .expect(201);

      expect(response.body.priority_assigned).toBe('medium');
    });
  });
});

// Additional integration tests
describe('Integration Tests', () => {
  test('Full workflow: Create resource, submit emergency request, register volunteer', async () => {
    // 1. Get a category
    const categoriesResponse = await request(app).get('/api/categories');
    const category = categoriesResponse.body.data[0];

    // 2. Create a resource
    const newResource = {
      name: 'Integration Test Resource',
      description: 'Resource for integration testing',
      category_id: category.id,
      address: '123 Integration St',
      phone: '+1-555-INTEG'
    };

    const resourceResponse = await request(app)
      .post('/api/resources')
      .send(newResource)
      .expect(201);

    const resourceId = resourceResponse.body.data.id;

    // 3. Submit emergency request
    const emergencyRequest = {
      requester_name: 'Integration Tester',
      description: 'Need urgent help for integration testing',
      category_id: category.id
    };

    const requestResponse = await request(app)
      .post('/api/emergency-requests')
      .send(emergencyRequest)
      .expect(201);

    const requestId = requestResponse.body.data.id;

    // 4. Register volunteer
    const volunteer = {
      name: 'Integration Volunteer',
      email: 'integration@test.com',
      skills: 'Testing, Integration'
    };

    const volunteerResponse = await request(app)
      .post('/api/volunteers/register')
      .send(volunteer)
      .expect(201);

    const volunteerId = volunteerResponse.body.data.id;

    // 5. Verify all entities exist
    await request(app).get(`/api/resources/${resourceId}`).expect(200);
    await request(app).get(`/api/emergency-requests/${requestId}`).expect(200);
    await request(app).get(`/api/volunteers/${volunteerId}`).expect(200);

    // 6. Check statistics reflect the new data
    const statsResponse = await request(app).get('/api/emergency-requests/stats');
    expect(statsResponse.body.data.totalResources).toBeGreaterThan(0);
    expect(statsResponse.body.data.totalRequests).toBeGreaterThan(0);
    expect(statsResponse.body.data.totalVolunteers).toBeGreaterThan(0);
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('API endpoints should respond within acceptable time limits', async () => {
    const endpoints = [
      '/api/health',
      '/api/categories',
      '/api/resources',
      '/api/emergency-requests',
      '/api/volunteers'
    ];

    for (const endpoint of endpoints) {
      const start = Date.now();
      await request(app).get(endpoint).expect(200);
      const duration = Date.now() - start;
      
      // Should respond within 1 second
      expect(duration).toBeLessThan(1000);
    }
  });
});

module.exports = { app };