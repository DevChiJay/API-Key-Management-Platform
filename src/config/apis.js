const ApiCatalog = require('../models/ApiCatalog');
const logger = require('../utils/logger');

// Service to load API configurations from the database
class ApiConfigService {
  constructor() {
    this.apiCache = null;
    this.lastCacheUpdate = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache TTL
  }

  /**
   * Get all active API configurations
   * @returns {Object} Map of API configurations by slug
   */
  async getApiConfigs() {
    try {
      // Check if cache is valid
      if (this.apiCache && this.lastCacheUpdate && 
          (Date.now() - this.lastCacheUpdate) < this.cacheTTL) {
        return this.apiCache;
      }

      // Load APIs from database
      const apis = await ApiCatalog.find({ isActive: true });
      
      // Transform to map by slug
      const apiMap = {};
      
      apis.forEach(api => {
        apiMap[api.slug] = {
          baseUrl: api.baseUrl,
          requiresAuth: api.gatewayConfig?.requiresAuth ?? true,
          rateLimit: {
            windowMs: api.gatewayConfig?.rateLimit?.windowMs ?? 60 * 60 * 1000,
            max: api.gatewayConfig?.rateLimit?.max ?? 100
          },
          headers: api.gatewayConfig?.headers || {},
          endpoints: api.endpoints || []
        };
      });
      
      // Update cache
      this.apiCache = apiMap;
      this.lastCacheUpdate = Date.now();
      
      return apiMap;
    } catch (error) {
      logger.error('Error loading API configurations from database:', error);
      
      // Fallback to empty config if database fails
      return {};
    }
  }
  
  /**
   * Clear the API configuration cache
   */
  clearCache() {
    this.apiCache = null;
    this.lastCacheUpdate = null;
  }
  
  /**
   * Get a specific API configuration by slug
   * @param {String} slug - API slug
   * @returns {Object|null} The API configuration or null if not found
   */
  async getApiConfig(slug) {
    const configs = await this.getApiConfigs();
    return configs[slug] || null;
  }
}

module.exports = new ApiConfigService();