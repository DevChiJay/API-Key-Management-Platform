const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayControllers');
const validateApiKey = require('../middleware/apiKeyValidator');
const { dynamicRateLimiter } = require('../middleware/rateLimiter');

// Apply API key validation to all gateway routes
router.use(validateApiKey);

// Apply dynamic rate limiting based on API key settings
router.use(dynamicRateLimiter);

// Route requests to specific APIs
router.use('/:apiName/*', gatewayController.routeApiRequest);

module.exports = router;