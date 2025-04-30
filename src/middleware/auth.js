const { requireAuth: clerkRequireAuth, getAuth } = require('@clerk/express');
const logger = require('../utils/logger');

// Middleware to handle Clerk authentication
const requireAuth = (req, res, next) => {
  clerkRequireAuth()(req, res, () => {
    const { userId } = getAuth(req);
    
    if (!userId) {
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
  });
};

// Optional: Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to access this resource'
      });
    }
    
    // Check if user has admin role from Clerk user metadata
    // This assumes you've set up admin role in Clerk user metadata
    const { sessionClaims } = req.auth;
    
    if (!sessionClaims || sessionClaims.role !== 'admin') {
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
  });
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