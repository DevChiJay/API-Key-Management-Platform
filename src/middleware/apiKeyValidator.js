const ApiKey = require('../models/ApiKey');
const UsageLog = require('../models/UsageLog');
const logger = require('../utils/logger');

/**
 * Middleware to validate API keys
 * Extracts API key from headers, validates it, and attaches key info to request
 */
const validateApiKey = async (req, res, next) => {
  try {
    // Extract API key from request headers
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required'
      });
    }

    // Find the API key in the database
    const keyDoc = await ApiKey.findOne({ key: apiKey }).populate('apiId');
    
    if (!keyDoc) {
      logger.warn(`Invalid API key attempt: ${apiKey}`);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key'
      });
    }

    // Check if key is active
    if (keyDoc.status !== 'active') {
      logger.warn(`Attempt to use inactive/revoked key: ${apiKey}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: `API key is ${keyDoc.status}`
      });
    }

    // Check if key is expired
    if (keyDoc.expiresAt && new Date() > keyDoc.expiresAt) {
      logger.warn(`Attempt to use expired key: ${apiKey}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'API key has expired'
      });
    }

    // Update last used timestamp
    keyDoc.lastUsed = new Date();
    await keyDoc.save();
    
    // Ensure rate limit values are numbers
    const rateLimit = {
      requests: Number(keyDoc.rateLimit?.requests) || 100,
      per: Number(keyDoc.rateLimit?.per) || 60 * 60 * 1000 // Default 1 hour
    };
    
    // Log for debugging
    logger.debug(`API key ${apiKey} validated. Rate limit: ${rateLimit.requests} requests per ${rateLimit.per}ms`);

    // Attach API key info to request for use in downstream middleware and controllers
    req.apiKey = {
      id: keyDoc._id,
      key: keyDoc.key,
      userId: keyDoc.userId, // This should be a Clerk user ID
      apiId: keyDoc.apiId._id,
      api: keyDoc.apiId,
      permissions: keyDoc.permissions,
      rateLimit: rateLimit
    };

    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate API key'
    });
  }
};

module.exports = validateApiKey;