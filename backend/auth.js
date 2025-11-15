const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Secret key for JWT signing (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

class AuthManager {
  constructor() {
    const configPath = path.join(__dirname, '../config/fortanix-config.json');
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Authenticate user with username and password
   */
  authenticate(username, password) {
    const users = this.config.app.users;

    // Find user by username
    const userEntry = Object.values(users).find(u => u.username === username);

    if (!userEntry) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Simple password check (in production, use bcrypt)
    if (userEntry.password !== password) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: userEntry.username,
        role: userEntry.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      token,
      user: {
        username: userEntry.username,
        role: userEntry.role
      }
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Express middleware to protect routes
   */
  requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const verification = this.verifyToken(token);

    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request
    req.user = verification.user;
    next();
  }

  /**
   * Middleware to check for specific roles
   */
  requireRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    };
  }
}

const authManager = new AuthManager();

module.exports = {
  authenticate: authManager.authenticate.bind(authManager),
  verifyToken: authManager.verifyToken.bind(authManager),
  requireAuth: authManager.requireAuth.bind(authManager),
  requireRole: authManager.requireRole.bind(authManager)
};
