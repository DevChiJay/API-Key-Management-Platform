const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Middleware to handle Clerk authentication
const requireAuth = ClerkExpressRequireAuth({
  // Optional custom error handling
  onError: (err, req, res) => {
    console.error('Authentication error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource'
    });
  }
});

// Helper to get the current authenticated user from Clerk
const getCurrentUser = (req) => {
  if (!req.auth || !req.auth.userId) {
    return null;
  }
  return {
    id: req.auth.userId,
    // Add other user properties as needed
  };
};

module.exports = {
  requireAuth,
  getCurrentUser
};