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

  // Create users table for authentication
  db.run(`
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

  // Sample resources with India-oriented names and addresses
  const resources = [
    {
      id: uuidv4(),
      name: 'AIIMS Delhi',
      description: '24/7 emergency services and specialized healthcare',
      category_id: categories[0].id, // Healthcare
      address: 'Ansari Nagar, New Delhi, Delhi 110029',
      latitude: 28.5672,
      longitude: 77.2100,
      phone: '+91-11-2659-8955',
      email: 'info@aiims.edu',
      website: 'https://www.aiims.edu',
      operating_hours: '24/7',
      capacity: 2500,
      current_availability: 450
    },
    {
      id: uuidv4(),
      name: 'Sahaara Shelter Home',
      description: 'Emergency shelter for families and individuals',
      category_id: categories[1].id, // Shelter
      address: 'Sector 15, Gurgaon, Haryana 122001',
      latitude: 28.4595,
      longitude: 77.0266,
      phone: '+91-124-427-8900',
      email: 'contact@sahaarashelter.org',
      operating_hours: '24/7',
      capacity: 200,
      current_availability: 45
    },
    {
      id: uuidv4(),
      name: 'Annapurna Food Bank',
      description: 'Free food distribution and community kitchen',
      category_id: categories[2].id, // Food Distribution
      address: 'Karol Bagh, New Delhi, Delhi 110005',
      latitude: 28.6519,
      longitude: 77.1909,
      phone: '+91-11-2575-3421',
      email: 'help@annapurnafoodbank.org',
      website: 'https://annapurnafoodbank.org',
      operating_hours: 'Daily 7AM-9PM',
      capacity: 500,
      current_availability: 275
    },
    {
      id: uuidv4(),
      name: 'Delhi Fire Station - Connaught Place',
      description: 'Emergency response and fire services',
      category_id: categories[3].id, // Emergency Services
      address: 'Connaught Place, New Delhi, Delhi 110001',
      latitude: 28.6315,
      longitude: 77.2167,
      phone: '+91-11-2331-1111',
      operating_hours: '24/7',
      capacity: 25,
      current_availability: 18
    },
    {
      id: uuidv4(),
      name: 'Manas Mental Health Centre',
      description: 'Mental health support and counseling services',
      category_id: categories[4].id, // Mental Health
      address: 'Defence Colony, New Delhi, Delhi 110024',
      latitude: 28.5706,
      longitude: 77.2294,
      phone: '+91-11-2433-7000',
      email: 'support@manashealth.org',
      website: 'https://manashealth.org',
      operating_hours: 'Mon-Sat 9AM-6PM',
      capacity: 100,
      current_availability: 25
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

  // Sample volunteers with Indian names and locations
  const volunteers = [
    {
      id: uuidv4(),
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@email.com',
      phone: '+91-98765-43210',
      skills: 'First Aid, Transportation',
      availability: 'Weekends',
      location: 'Connaught Place, Delhi',
      latitude: 28.6315,
      longitude: 77.2167
    },
    {
      id: uuidv4(),
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91-87654-32109',
      skills: 'Counseling, Food Service',
      availability: 'Evenings',
      location: 'Karol Bagh, Delhi',
      latitude: 28.6519,
      longitude: 77.1909
    },
    {
      id: uuidv4(),
      name: 'Amit Singh',
      email: 'amit.singh@email.com',
      phone: '+91-76543-21098',
      skills: 'Transportation, General Help',
      availability: 'Flexible',
      location: 'Gurgaon, Haryana',
      latitude: 28.4595,
      longitude: 77.0266
    },
    {
      id: uuidv4(),
      name: 'Sunita Devi',
      email: 'sunita.devi@email.com',
      phone: '+91-65432-10987',
      skills: 'Medical Care, Community Outreach',
      availability: 'Mornings',
      location: 'Defence Colony, Delhi',
      latitude: 28.5706,
      longitude: 77.2294
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