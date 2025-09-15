const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize database schema
const initializeDatabase = () => {
  // Create categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create resources table
  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      phone TEXT,
      email TEXT,
      website TEXT,
      operating_hours TEXT,
      capacity INTEGER,
      current_availability INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Create emergency_requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS emergency_requests (
      id TEXT PRIMARY KEY,
      requester_name TEXT NOT NULL,
      requester_phone TEXT,
      requester_email TEXT,
      description TEXT NOT NULL,
      category_id TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'open',
      assigned_volunteer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id),
      FOREIGN KEY (assigned_volunteer_id) REFERENCES volunteers (id)
    )
  `);

  // Create volunteers table
  db.run(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      skills TEXT,
      availability TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database schema created successfully');
};

// Insert sample data
const insertSampleData = () => {
  // Sample categories
  const categories = [
    { id: uuidv4(), name: 'Healthcare', description: 'Hospitals, clinics, and medical services', icon: '🏥', color: '#e74c3c' },
    { id: uuidv4(), name: 'Shelter', description: 'Emergency shelters and housing assistance', icon: '🏠', color: '#3498db' },
    { id: uuidv4(), name: 'Food Distribution', description: 'Food banks, meal programs, and nutrition services', icon: '🍽️', color: '#27ae60' },
    { id: uuidv4(), name: 'Emergency Services', description: 'Fire, police, and emergency response', icon: '🚨', color: '#f39c12' },
    { id: uuidv4(), name: 'Mental Health', description: 'Counseling and psychological support services', icon: '🧠', color: '#9b59b6' },
    { id: uuidv4(), name: 'Transportation', description: 'Public transport and emergency transportation', icon: '🚗', color: '#34495e' }
  ];

  categories.forEach(category => {
    db.run(`INSERT OR REPLACE INTO categories (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [category.id, category.name, category.description, category.icon, category.color]);
  });

  // Sample resources
  const resources = [
    {
      id: uuidv4(),
      name: 'City General Hospital',
      description: '24/7 emergency services and general healthcare',
      category_id: categories[0].id, // Healthcare
      address: '123 Main St, Downtown',
      latitude: 40.7128,
      longitude: -74.0060,
      phone: '+1-555-0123',
      email: 'info@citygeneral.com',
      website: 'https://citygeneral.com',
      operating_hours: '24/7',
      capacity: 200,
      current_availability: 45
    },
    {
      id: uuidv4(),
      name: 'Safe Haven Shelter',
      description: 'Emergency shelter for families and individuals',
      category_id: categories[1].id, // Shelter
      address: '456 Oak Ave, Midtown',
      latitude: 40.7589,
      longitude: -73.9851,
      phone: '+1-555-0456',
      email: 'contact@safehavenshelter.org',
      operating_hours: '24/7',
      capacity: 50,
      current_availability: 12
    },
    {
      id: uuidv4(),
      name: 'Community Food Bank',
      description: 'Free food distribution and meal programs',
      category_id: categories[2].id, // Food Distribution
      address: '789 Pine St, Westside',
      latitude: 40.7505,
      longitude: -73.9934,
      phone: '+1-555-0789',
      email: 'help@communityfoodbank.org',
      website: 'https://communityfoodbank.org',
      operating_hours: 'Mon-Fri 9AM-5PM, Sat 10AM-2PM',
      capacity: 100,
      current_availability: 75
    },
    {
      id: uuidv4(),
      name: 'Fire Station 15',
      description: 'Emergency response and fire services',
      category_id: categories[3].id, // Emergency Services
      address: '321 Elm St, Northside',
      latitude: 40.7831,
      longitude: -73.9712,
      phone: '+1-555-0321',
      operating_hours: '24/7',
      capacity: 10,
      current_availability: 8
    },
    {
      id: uuidv4(),
      name: 'Hope Counseling Center',
      description: 'Mental health support and counseling services',
      category_id: categories[4].id, // Mental Health
      address: '654 Maple Dr, Southside',
      latitude: 40.7282,
      longitude: -74.0776,
      phone: '+1-555-0654',
      email: 'support@hopecounseling.org',
      website: 'https://hopecounseling.org',
      operating_hours: 'Mon-Fri 8AM-6PM, Sat 10AM-4PM',
      capacity: 20,
      current_availability: 5
    }
  ];

  resources.forEach(resource => {
    db.run(`INSERT OR REPLACE INTO resources 
            (id, name, description, category_id, address, latitude, longitude, phone, email, website, operating_hours, capacity, current_availability) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resource.id, resource.name, resource.description, resource.category_id, resource.address, 
       resource.latitude, resource.longitude, resource.phone, resource.email, resource.website, 
       resource.operating_hours, resource.capacity, resource.current_availability]);
  });

  // Sample volunteers
  const volunteers = [
    {
      id: uuidv4(),
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-1001',
      skills: 'First Aid, Transportation',
      availability: 'Weekends',
      location: 'Downtown',
      latitude: 40.7128,
      longitude: -74.0060
    },
    {
      id: uuidv4(),
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-1002',
      skills: 'Counseling, Food Service',
      availability: 'Evenings',
      location: 'Midtown',
      latitude: 40.7589,
      longitude: -73.9851
    },
    {
      id: uuidv4(),
      name: 'Mike Davis',
      email: 'mike.davis@email.com',
      phone: '+1-555-1003',
      skills: 'Transportation, General Help',
      availability: 'Flexible',
      location: 'Westside',
      latitude: 40.7505,
      longitude: -73.9934
    }
  ];

  volunteers.forEach(volunteer => {
    db.run(`INSERT OR REPLACE INTO volunteers 
            (id, name, email, phone, skills, availability, location, latitude, longitude) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [volunteer.id, volunteer.name, volunteer.email, volunteer.phone, 
       volunteer.skills, volunteer.availability, volunteer.location, volunteer.latitude, volunteer.longitude]);
  });

  console.log('Sample data inserted successfully');
};

// Initialize database
initializeDatabase();

// Wait a bit then insert sample data
setTimeout(() => {
  insertSampleData();
  
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database initialization completed successfully');
        console.log(`Database created at: ${dbPath}`);
      }
    });
  }, 1000);
}, 1000);