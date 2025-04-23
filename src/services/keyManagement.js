const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const ApiKey = require('../models/ApiKey');
const ApiCatalog = require('../models/ApiCatalog');
const logger = require('../utils/logger');

/**
 * Service to manage API key operations
 */
class KeyManagementService {
  /**
   * Generate a new API key for a user
   * @param {String} userId - User ID from Clerk
   * @param {Object} keyData - Data for the new key
   * @returns {Object} The generated API key document
   */
  async generateKey(userId, keyData) {
    try {
      // Validate API exists
      const api = await ApiCatalog.findById(keyData.apiId);
      if (!api) {
        throw new Error(`API with ID ${keyData.apiId} not found`);
      }

      // Generate a unique key
      const key = this.createUniqueKey();

      // Create the API key with user info and API settings
      const apiKey = new ApiKey({
        userId,
        key,
        apiId: api._id,
        name: keyData.name || `${api.name} Key`,
        permissions: keyData.permissions || ['read'],
        rateLimit: keyData.rateLimit || api.defaultRateLimit,
        expiresAt: keyData.expiresAt || null,
      });

      await apiKey.save();
      logger.info(`Generated new API key for user ${userId} for API ${api.name}`);

      return apiKey;
    } catch (error) {
      logger.error('Error generating API key:', error);
      throw error;
    }
  }

  /**
   * Create a unique API key string
   * @returns {String} A unique API key
   */
  createUniqueKey() {
    // Format: prefix.random-uuid-part.timestamp.checksum
    const prefix = 'apk';
    const uuid = uuidv4().replace(/-/g, '').substring(0, 16);
    const timestamp = Date.now().toString(36);
    const data = `${prefix}.${uuid}.${timestamp}`;
    const checksum = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 8);

    return `${data}.${checksum}`;
  }

  /**
   * Revoke an API key
   * @param {String} keyId - The ID of the key to revoke
   * @param {String} userId - User ID from Clerk
   * @returns {Object} The updated API key
   */
  async revokeKey(keyId, userId) {
    try {
      const apiKey = await ApiKey.findOne({ _id: keyId, userId });
      
      if (!apiKey) {
        throw new Error('API key not found or not owned by user');
      }

      apiKey.status = 'revoked';
      await apiKey.save();
      
      logger.info(`API key ${apiKey.key} revoked by user ${userId}`);
      return apiKey;
    } catch (error) {
      logger.error('Error revoking API key:', error);
      throw error;
    }
  }

  /**
   * Get all API keys for a user
   * @param {String} userId - User ID from Clerk
   * @returns {Array} List of API keys
   */
  async getUserKeys(userId) {
    try {
      const keys = await ApiKey.find({ userId }).populate('apiId');
      return keys;
    } catch (error) {
      logger.error('Error fetching user API keys:', error);
      throw error;
    }
  }

  /**
   * Get a specific API key by ID
   * @param {String} keyId - The ID of the key
   * @param {String} userId - User ID from Clerk
   * @returns {Object} The API key document
   */
  async getKeyById(keyId, userId) {
    try {
      const key = await ApiKey.findOne({ _id: keyId, userId }).populate('apiId');
      
      if (!key) {
        throw new Error('API key not found or not owned by user');
      }
      
      return key;
    } catch (error) {
      logger.error('Error fetching API key:', error);
      throw error;
    }
  }

  /**
   * Update an API key's properties
   * @param {String} keyId - The ID of the key to update
   * @param {String} userId - User ID from Clerk
   * @param {Object} updateData - The fields to update
   * @returns {Object} The updated API key
   */
  async updateKey(keyId, userId, updateData) {
    try {
      const apiKey = await ApiKey.findOne({ _id: keyId, userId });
      
      if (!apiKey) {
        throw new Error('API key not found or not owned by user');
      }

      // Fields that can be updated
      const allowedUpdates = ['name', 'status', 'permissions', 'rateLimit', 'expiresAt'];
      
      // Apply updates
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          apiKey[field] = updateData[field];
        }
      });

      await apiKey.save();
      logger.info(`API key ${apiKey.key} updated by user ${userId}`);
      
      return apiKey;
    } catch (error) {
      logger.error('Error updating API key:', error);
      throw error;
    }
  }
}

module.exports = new KeyManagementService();