const { clerkClient, getAuth } = require('@clerk/express');
const logger = require('../utils/logger');

// Note: With Clerk, you don't need to implement register or login
// These are handled by Clerk's frontend. These functions are kept
// as placeholders for endpoints that might be needed for your application

// A placeholder for register
exports.register = async (req, res) => {
  // With Clerk, registration is handled by Clerk's frontend
  // This endpoint could be used for additional custom logic
  res.status(200).json({
    success: true,
    message: 'Registration is handled by Clerk. Please use the Clerk frontend components.'
  });
};

// A placeholder for login
exports.login = async (req, res) => {
  // With Clerk, login is handled by Clerk's frontend
  // This endpoint could be used for additional custom logic
  res.status(200).json({
    success: true,
    message: 'Login is handled by Clerk. Please use the Clerk frontend components.'
  });
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }
    
    // Transform user data for your API response
    const userData = {
      id: user.id,
      username: user.username || `${user.firstName} ${user.lastName}`.trim(),
      email: user.emailAddresses[0]?.emailAddress,
      // Get role from metadata or public metadata
      role: user.publicMetadata?.role || 'user'
    };
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile'
    });
  }
};
