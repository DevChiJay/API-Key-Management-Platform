const rateLimit = require('express-rate-limit');
const { MemoryStore } = require('express-rate-limit');
const logger = require('../utils/logger');

// Create persistent stores for different rate limits
const rateLimitStores = {};

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
  
  // Create a unique identifier for this rate limiter configuration
  const limiterKey = `${limiterOptions.windowMs}_${limiterOptions.max}`;
  
  // Use existing store or create new one for this configuration
  if (!rateLimitStores[limiterKey]) {
    logger.debug(`Creating new rate limit store with window: ${limiterOptions.windowMs}ms, max: ${limiterOptions.max} requests`);
    rateLimitStores[limiterKey] = new MemoryStore();
  }
  
  // Use the persistent store
  limiterOptions.store = rateLimitStores[limiterKey];

  return rateLimit(limiterOptions);
};

// Cache for dynamic rate limiters to avoid creating new instances on every request
const dynamicLimiterCache = {};

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
  
  // Log the rate limit settings for debugging
  logger.debug(`API key ${req.apiKey.key} rate limit: ${requests} requests per ${per}ms`);
  
  // Create a cache key based on the rate limit settings
  const cacheKey = `${req.apiKey.key}_${requests}_${per}`;
  
  // Use cached limiter or create a new one
  if (!dynamicLimiterCache[cacheKey]) {
    logger.debug(`Creating new rate limiter for key: ${req.apiKey.key}`);
    dynamicLimiterCache[cacheKey] = createRateLimiter({
      windowMs: per,
      max: requests
    });
  }

  // Apply the cached rate limiter
  return dynamicLimiterCache[cacheKey](req, res, next);
};

module.exports = {
  createRateLimiter,
  dynamicRateLimiter
};