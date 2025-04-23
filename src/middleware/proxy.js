const { createProxyMiddleware } = require('http-proxy-middleware');
const UsageLog = require('../models/UsageLog');
const apis = require('../config/apis');
const logger = require('../utils/logger');

/**
 * Creates a proxy middleware for a specific API
 * @param {Object} apiConfig - Configuration for the API
 * @returns {Function} Proxy middleware
 */
const createApiProxy = (apiConfig) => {
  return createProxyMiddleware({
    target: apiConfig.baseUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      // Remove the API prefix from the path
      // e.g., /gateway/github/users -> /users
      const apiPath = req.originalUrl.replace(new RegExp(`^/gateway/${req.params.apiName}`), '');
      return apiPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Start timer for response time measurement
      req.proxyStartTime = Date.now();
      
      // Add any headers needed for the external API
      // This is where you'd add API-specific auth if needed
      logger.info(`Proxying request to ${req.params.apiName}: ${req.method} ${req.originalUrl}`);
    },
    onProxyRes: async (proxyRes, req, res) => {
      // Record response time
      const responseTime = Date.now() - req.proxyStartTime;
      
      try {
        // Log API usage if API key is present
        if (req.apiKey) {
          const usageLog = new UsageLog({
            apiKeyId: req.apiKey.id,
            userId: req.apiKey.userId,
            apiId: req.apiKey.apiId,
            endpoint: req.originalUrl,
            method: req.method,
            responseStatus: proxyRes.statusCode,
            responseTime,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
          
          await usageLog.save();
        }
      } catch (error) {
        logger.error('Error logging API usage:', error);
      }
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${req.params.apiName}:`, err);
      res.status(500).json({
        error: 'Proxy Error',
        message: 'Failed to proxy request to external API'
      });
    }
  });
};

module.exports = { createApiProxy };