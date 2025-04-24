const ApiKey = require('../models/ApiKey');
const ApiCatalog = require('../models/ApiCatalog');
const logger = require('../utils/logger');

/**
 * Service to manage API access policies
 */
class PolicyService {
  /**
   * Check if a user has permission to access a specific API
   * @param {String} userId - User ID from Clerk
   * @param {String} apiId - API ID to check permission for
   * @returns {Boolean} Whether the user has permission
   */
  async canAccessApi(userId, apiId) {
    try {
      // Here you can implement more complex policy rules
      // For now, just check if the user has an active key for this API
      const hasKey = await ApiKey.exists({
        userId,
        apiId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      });
      
      return !!hasKey;
    } catch (error) {
      logger.error(`Error checking API access policy for user ${userId}:`, error);
      // Default to false for safety in case of errors
      return false;
    }
  }

  /**
   * Check if a key has the required permissions for an operation
   * @param {String} keyId - API Key ID
   * @param {String} requiredPermission - Permission to check
   * @returns {Boolean} Whether the key has the required permission
   */
  async hasPermission(keyId, requiredPermission) {
    try {
      const key = await ApiKey.findById(keyId);
      
      if (!key) {
        return false;
      }
      
      // Special case: 'admin' permission implies all permissions
      if (key.permissions.includes('admin')) {
        return true;
      }
      
      return key.permissions.includes(requiredPermission);
    } catch (error) {
      logger.error(`Error checking permissions for key ${keyId}:`, error);
      return false;
    }
  }

  /**
   * Add a permission to an API key
   * @param {String} keyId - API Key ID
   * @param {String} userId - User ID from Clerk (for access control)
   * @param {String} permission - Permission to add
   * @returns {Object} Updated key
   */
  async addPermission(keyId, userId, permission) {
    try {
      const key = await ApiKey.findOne({ _id: keyId, userId });
      
      if (!key) {
        throw new Error('API key not found or not owned by user');
      }
      
      if (!key.permissions.includes(permission)) {
        key.permissions.push(permission);
        await key.save();
      }
      
      return key;
    } catch (error) {
      logger.error(`Error adding permission to key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a permission from an API key
   * @param {String} keyId - API Key ID
   * @param {String} userId - User ID from Clerk (for access control)
   * @param {String} permission - Permission to remove
   * @returns {Object} Updated key
   */
  async removePermission(keyId, userId, permission) {
    try {
      const key = await ApiKey.findOne({ _id: keyId, userId });
      
      if (!key) {
        throw new Error('API key not found or not owned by user');
      }
      
      key.permissions = key.permissions.filter(p => p !== permission);
      await key.save();
      
      return key;
    } catch (error) {
      logger.error(`Error removing permission from key ${keyId}:`, error);
      throw error;
    }
  }
}

module.exports = new PolicyService();