const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const database = require('./database');
const fortanix = require('./fortanix');
const { authenticate, requireAuth, requireRole } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const result = authenticate(username, password);

    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }

    res.json({
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new record (admin and editor only)
app.post('/api/records', requireAuth, requireRole(['admin', 'editor']), async (req, res) => {
  try {
    const { name, phone, email, ssn, accountNumber, passportNumber, serviceRequest } = req.body;

    // Validate required fields
    if (!name || !phone || !email || !ssn || !accountNumber || !passportNumber || !serviceRequest) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Create record object
    const record = {
      name,
      phone,
      email,
      ssn,
      accountNumber,
      passportNumber,
      serviceRequest,
      createdBy: req.user.username
    };

    // Tokenize sensitive fields using the user's role
    const tokenizedRecord = await fortanix.tokenizeRecord(record, req.user.role);

    // Insert into database
    const recordId = database.insertRecord(tokenizedRecord);

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      recordId
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({
      error: 'Failed to create record',
      message: error.message
    });
  }
});

// Get all records (all authenticated users)
app.get('/api/records', requireAuth, async (req, res) => {
  try {
    // Get all records from database (tokenized)
    const records = database.getAllRecords();

    // Detokenize based on user's role permissions
    const processedRecords = await fortanix.detokenizeRecords(records, req.user.role);

    res.json({
      success: true,
      records: processedRecords,
      count: processedRecords.length
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({
      error: 'Failed to fetch records',
      message: error.message
    });
  }
});

// Search records (viewer role primarily, but available to all)
app.get('/api/records/search', requireAuth, async (req, res) => {
  try {
    const { query, field } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Validate search field
    const allowedFields = ['name', 'accountNumber'];
    const searchField = field && allowedFields.includes(field) ? field : 'name';

    let searchQuery = query;

    // If searching by name, tokenize the query first since names are stored tokenized
    if (searchField === 'name') {
      try {
        searchQuery = await fortanix.tokenize(query, 'name', req.user.role);
        console.log(`[Search] Tokenized "${query}" to "${searchQuery}"`);
      } catch (error) {
        console.error('[Search] Failed to tokenize search query:', error);
        // If tokenization fails, use the original query
      }
    }

    // Search in database with tokenized query (for name) or plain query (for accountNumber)
    const records = database.searchRecords(searchQuery, searchField);

    // Detokenize based on user's role permissions
    const processedRecords = await fortanix.detokenizeRecords(records, req.user.role);

    res.json({
      success: true,
      records: processedRecords,
      count: processedRecords.length,
      searchField,
      query
    });
  } catch (error) {
    console.error('Error searching records:', error);
    res.status(500).json({
      error: 'Failed to search records',
      message: error.message
    });
  }
});

// Get raw database records (admin only - for verification)
app.get('/api/records/raw/view', requireAuth, requireRole(['admin']), (req, res) => {
  try {
    // Get raw records from database without detokenization
    const records = database.getAllRecords();

    res.json({
      success: true,
      message: 'Raw database records (tokenized)',
      records: records,
      count: records.length,
      note: 'These are the raw tokenized values as stored in the database'
    });
  } catch (error) {
    console.error('Error fetching raw records:', error);
    res.status(500).json({
      error: 'Failed to fetch raw records',
      message: error.message
    });
  }
});

// Get a single record by ID
app.get('/api/records/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const record = database.getRecordById(id);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Detokenize based on user's role permissions
    const processedRecord = await fortanix.detokenizeRecord(record, req.user.role);

    res.json({
      success: true,
      record: processedRecord
    });
  } catch (error) {
    console.error('Error fetching record:', error);
    res.status(500).json({
      error: 'Failed to fetch record',
      message: error.message
    });
  }
});

// Delete a record (admin only)
app.delete('/api/records/:id', requireAuth, requireRole(['admin']), (req, res) => {
  try {
    const { id } = req.params;

    const deleted = database.deleteRecord(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({
      error: 'Failed to delete record',
      message: error.message
    });
  }
});

// Get user info
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      username: req.user.username,
      role: req.user.role
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  database.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  database.close();
  process.exit(0);
});
