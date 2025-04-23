const rateLimit = require('express-rate-limit');
const UsageLog = require('../models/UsageLog');
const logger = require('../utils/logger');

/**
 * Creates a rate limiter based on API key settings
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes by default
    max: 100, // limit each IP to 100 requests per windowMs by default
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Use API key as the rate limit key if available
      if (req.apiKey && req.apiKey.key) {
        return req.apiKey.key;
      }
      // Fall back to IP address
      return req.ip;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for key: ${req.apiKey?.key || 'unknown'}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    }
  };

  // Merge default options with user options
  const limiterOptions = { ...defaultOptions, ...options };

  return rateLimit(limiterOptions);
};

/**
 * Dynamic rate limiter middleware that uses the API key's rate limit settings
 */
const dynamicRateLimiter = (req, res, next) => {
  // If no API key on request, use default rate limits
  if (!req.apiKey || !req.apiKey.rateLimit) {
    return createRateLimiter()(req, res, next);
  }

  // Get rate limit settings from the API key
  const { requests, per } = req.apiKey.rateLimit;
  
  // Create a custom rate limiter for this key
  const keyLimiter = createRateLimiter({
    windowMs: per,
    max: requests
  });

  // Apply the custom rate limiter
  return keyLimiter(req, res, next);
};

module.exports = {
  createRateLimiter,
  dynamicRateLimiter
};