const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Middleware to handle JWT authentication
const requireAuth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    // Check if auth header exists and follows Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to access this resource'
      });
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || 'user'
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

// Optional: Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required for this resource'
      });
    }
    next();
  });
};

// Helper to get the current authenticated user from request
const getCurrentUser = (req) => {
  if (!req.user) {
    return null;
  }
  return {
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  getCurrentUser
};