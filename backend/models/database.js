const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// Database connection
class Database {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });

    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Generic CRUD operations
  async create(table, data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const result = await this.run(query, values);
    return result.lastID;
  }

  async findById(table, id) {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    return await this.get(query, [id]);
  }

  async findAll(table, conditions = {}, limit = null, offset = null) {
    let query = `SELECT * FROM ${table}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions)
        .map(key => `${key} = ?`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      query += ' LIMIT ?';
      values.push(limit);
    }

    if (offset) {
      query += ' OFFSET ?';
      values.push(offset);
    }

    return await this.all(query, values);
  }

  async update(table, id, data) {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(data), id];
    
    const query = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const result = await this.run(query, values);
    return result.changes > 0;
  }

  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const result = await this.run(query, [id]);
    return result.changes > 0;
  }

  // Custom queries for complex operations
  async searchResources(filters = {}) {
    let query = `
      SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM resources r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.status = 'active'
    `;
    const values = [];

    if (filters.category_id) {
      query += ' AND r.category_id = ?';
      values.push(filters.category_id);
    }

    if (filters.search) {
      query += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      values.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.latitude && filters.longitude && filters.radius) {
      // Simple distance calculation (not perfect but good for MVP)
      query += `
        AND (
          (r.latitude - ?) * (r.latitude - ?) + 
          (r.longitude - ?) * (r.longitude - ?)
        ) <= ?
      `;
      const radiusSquared = Math.pow(filters.radius / 111.0, 2); // Rough conversion
      values.push(filters.latitude, filters.latitude, filters.longitude, filters.longitude, radiusSquared);
    }

    query += ' ORDER BY r.created_at DESC';

    return await this.all(query, values);
  }

  async getEmergencyRequestsWithDetails() {
    const query = `
      SELECT 
        er.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        v.name as volunteer_name,
        v.phone as volunteer_phone
      FROM emergency_requests er
      LEFT JOIN categories c ON er.category_id = c.id
      LEFT JOIN volunteers v ON er.assigned_volunteer_id = v.id
      ORDER BY 
        CASE er.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        er.created_at DESC
    `;
    return await this.all(query);
  }

  async getAvailableVolunteers(skills = null, location = null) {
    let query = `
      SELECT * FROM volunteers 
      WHERE status = 'active'
    `;
    const values = [];

    if (skills) {
      query += ' AND skills LIKE ?';
      values.push(`%${skills}%`);
    }

    if (location) {
      query += ' AND location LIKE ?';
      values.push(`%${location}%`);
    }

    query += ' ORDER BY created_at DESC';

    return await this.all(query, values);
  }

  async getResourceStatistics() {
    const queries = {
      totalResources: 'SELECT COUNT(*) as count FROM resources WHERE status = "active"',
      totalRequests: 'SELECT COUNT(*) as count FROM emergency_requests WHERE status != "closed"',
      totalVolunteers: 'SELECT COUNT(*) as count FROM volunteers WHERE status = "active"',
      highPriorityRequests: 'SELECT COUNT(*) as count FROM emergency_requests WHERE priority = "high" AND status = "open"'
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const result = await this.get(query);
      results[key] = result.count;
    }

    return results;
  }
}

// Singleton database instance
let dbInstance = null;

const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
};

module.exports = { Database, getDatabase };