const { requireAuth: clerkRequireAuth, getAuth } = require('@clerk/express');
const logger = require('../utils/logger');

// Middleware to handle Clerk authentication with JSON responses
const requireAuth = (req, res, next) => {
  // Get auth data from Clerk
  const { userId } = getAuth(req);
  
  // If no userId, user is not authenticated
  if (!userId) {
    logger.warn(`Unauthenticated access attempt to ${req.originalUrl}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource'
    });
  }
  
  // Add userId to req for easier access in controllers
  req.userId = userId;
  
  // Also set user object for backward compatibility
  req.user = { id: userId };
  
  next();
};

// Optional: Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  // Get auth data from Clerk
  const { userId, sessionClaims } = getAuth(req);
  
  // Check authentication
  if (!userId) {
    logger.warn(`Unauthenticated access attempt to admin route ${req.originalUrl}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource'
    });
  }
  
  // Check admin role
  if (!sessionClaims || sessionClaims.role !== 'admin') {
    logger.warn(`Non-admin user ${userId} attempted to access admin route ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required for this resource'
    });
  }
  
  // Add userId to req for easier access in controllers
  req.userId = userId;
  
  // Also set user object for backward compatibility
  req.user = { id: userId };
  
  next();
};

// Helper to get the current authenticated user from request
const getCurrentUser = (req) => {
  const auth = getAuth(req);
  if (!auth || !auth.userId) {
    return null;
  }
  
  return {
    id: auth.userId,
    // Other user details will need to be fetched from Clerk
    // using clerkClient.users.getUser(auth.userId)
  };
};

module.exports = {
  requireAuth,
  requireAdmin,
  getCurrentUser
};