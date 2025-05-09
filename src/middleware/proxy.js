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
    // Enable WebSockets for all requests
    ws: true,
    // Preserve original request bodies (important for POST requests)
    bodyParser: false,
    pathRewrite: (path, req) => {
      // Remove the API prefix from the path
      // e.g., /gateway/github/users -> /users
      const apiPath = req.originalUrl.replace(new RegExp(`^/gateway/${req.params.apiName}`), '');
      return apiPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      // Start timer for response time measurement
      req.proxyStartTime = Date.now();
      
      // Handle POST/PUT requests with JSON body correctly
      if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
        // If the body was already parsed by bodyParser, we need to rewrite the request body
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body);
          
          // Update content-length header
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.setHeader('Content-Type', 'application/json');
          
          // Write the parsed body back to the proxy request
          proxyReq.write(bodyData);
          proxyReq.end();
        }
      }
      
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