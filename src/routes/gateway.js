const express = require('express');
const router = express.Router();
const apis = require('../config/apis');
const validateApiKey = require('../middleware/apiKeyValidator');
const { dynamicRateLimiter } = require('../middleware/rateLimiter');
const { createApiProxy } = require('../middleware/proxy');
const logger = require('../utils/logger');

// Apply API key validation to all gateway routes
router.use(validateApiKey);

// Apply dynamic rate limiting based on API key settings
router.use(dynamicRateLimiter);

// Route requests to specific APIs
router.use('/:apiName/*', (req, res, next) => {
  const { apiName } = req.params;
  const apiConfig = apis[apiName];

  if (!apiConfig) {
    logger.warn(`Attempt to access unknown API: ${apiName}`);
    return res.status(404).json({
      error: 'Not Found',
      message: `API '${apiName}' not found`
    });
  }

  // Check if user's API key has access to this API
  if (req.apiKey.api.slug !== apiName) {
    logger.warn(`API key not authorized for ${apiName}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: `This API key does not have access to '${apiName}'`
    });
  }

  // Create and apply proxy for this API
  const apiProxy = createApiProxy(apiConfig);
  apiProxy(req, res, next);
});

module.exports = router;