const Database = require('better-sqlite3');
const path = require('path');

class DatabaseManager {
  constructor() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  /**
   * Initialize database schema
   */
  initDatabase() {
    // Create records table to store tokenized sensitive data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        ssn TEXT NOT NULL,
        account_number TEXT NOT NULL,
        passport_number TEXT,
        service_request TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add passport_number column if it doesn't exist (for existing databases)
    try {
      this.db.exec(`ALTER TABLE records ADD COLUMN passport_number TEXT`);
      console.log('Added passport_number column to existing table');
    } catch (error) {
      // Column already exists, ignore error
    }

    console.log('Database initialized successfully');
  }

  /**
   * Insert a new record (already tokenized)
   */
  insertRecord(record) {
    const stmt = this.db.prepare(`
      INSERT INTO records (name, phone, email, ssn, account_number, passport_number, service_request, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      record.name,
      record.phone,
      record.email,
      record.ssn,
      record.accountNumber,
      record.passportNumber,
      record.serviceRequest,
      record.createdBy
    );

    return result.lastInsertRowid;
  }

  /**
   * Get all records
   */
  getAllRecords() {
    const stmt = this.db.prepare('SELECT * FROM records ORDER BY created_at DESC');
    const rows = stmt.all();

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      ssn: row.ssn,
      accountNumber: row.account_number,
      passportNumber: row.passport_number,
      serviceRequest: row.service_request,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  /**
   * Search records by name or account number
   */
  searchRecords(searchTerm, searchField = 'name') {
    let query;

    if (searchField === 'name') {
      query = 'SELECT * FROM records WHERE name LIKE ? ORDER BY created_at DESC';
    } else if (searchField === 'accountNumber') {
      query = 'SELECT * FROM records WHERE account_number LIKE ? ORDER BY created_at DESC';
    } else {
      return [];
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(`%${searchTerm}%`);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      ssn: row.ssn,
      accountNumber: row.account_number,
      passportNumber: row.passport_number,
      serviceRequest: row.service_request,
      createdBy: row.created_by,
      createdAt: row.created_at
    }));
  }

  /**
   * Get a single record by ID
   */
  getRecordById(id) {
    const stmt = this.db.prepare('SELECT * FROM records WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      ssn: row.ssn,
      accountNumber: row.account_number,
      passportNumber: row.passport_number,
      serviceRequest: row.service_request,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }

  /**
   * Delete a record
   */
  deleteRecord(id) {
    const stmt = this.db.prepare('DELETE FROM records WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

module.exports = new DatabaseManager();
