const keyManagementService = require('../services/keyManagement');
const metricsService = require('../services/metricsService');
const logger = require('../utils/logger');

// Get all keys for the authenticated user
exports.getUserKeys = async (req, res) => {
  try {
    const userId = req.userId;
    const keys = await keyManagementService.getUserKeys(userId);
    
    // Filter out sensitive data from the response
    const keyList = keys.map(key => ({
      id: key._id,
      name: key.name,
      apiName: key.apiId.name,
      status: key.status,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed,
      permissions: key.permissions
    }));
    
    res.json({ keys: keyList });
  } catch (error) {
    logger.error('Error getting user keys:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API keys'
    });
  }
};

// Get a specific key by ID
exports.getKeyById = async (req, res) => {
  try {
    const userId = req.userId;
    const key = await keyManagementService.getKeyById(req.params.id, userId);
    
    res.json({
      id: key._id,
      name: key.name,
      key: key.key,
      apiName: key.apiId.name,
      apiId: key.apiId._id,
      status: key.status,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed
    });
  } catch (error) {
    logger.error(`Error getting key ${req.params.id}:`, error);
    res.status(404).json({
      error: 'Not Found',
      message: 'API key not found or not owned by you'
    });
  }
};

// Generate a new API key
exports.generateKey = async (req, res) => {
  try {
    const { apiId, name, permissions, rateLimit, expiresAt } = req.body;
    
    if (!apiId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'API ID is required'
      });
    }
    
    const userId = req.userId;
    const keyData = { apiId, name, permissions, rateLimit, expiresAt };
    
    const newKey = await keyManagementService.generateKey(userId, keyData);
    
    logger.info(`User ${userId} created new API key for API ID ${apiId}`);
    
    res.status(201).json({
      id: newKey._id,
      name: newKey.name,
      key: newKey.key, // This will be shown only once
      apiId: newKey.apiId,
      status: newKey.status,
      permissions: newKey.permissions,
      rateLimit: newKey.rateLimit,
      createdAt: newKey.createdAt,
      expiresAt: newKey.expiresAt
    });
  } catch (error) {
    logger.error('Error generating API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate API key'
    });
  }
};

// Revoke an API key
exports.revokeKey = async (req, res) => {
  try {
    const userId = req.userId;
    const keyId = req.params.id;
    
    const revokedKey = await keyManagementService.revokeKey(keyId, userId);
    
    logger.info(`User ${userId} revoked API key ${keyId}`);
    
    res.json({
      id: revokedKey._id,
      status: revokedKey.status,
      message: 'API key has been revoked'
    });
  } catch (error) {
    logger.error(`Error revoking key ${req.params.id}:`, error);
    res.status(404).json({
      error: 'Not Found',
      message: 'API key not found or not owned by you'
    });
  }
};

// Update an API key
exports.updateKey = async (req, res) => {
  try {
    const userId = req.userId;
    const keyId = req.params.id;
    const { name, status, permissions, rateLimit, expiresAt } = req.body;
    
    const updatedKey = await keyManagementService.updateKey(keyId, userId, {
      name, status, permissions, rateLimit, expiresAt
    });
    
    logger.info(`User ${userId} updated API key ${keyId}`);
    
    res.json({
      id: updatedKey._id,
      name: updatedKey.name,
      status: updatedKey.status,
      permissions: updatedKey.permissions,
      rateLimit: updatedKey.rateLimit,
      expiresAt: updatedKey.expiresAt,
      message: 'API key has been updated'
    });
  } catch (error) {
    logger.error(`Error updating key ${req.params.id}:`, error);
    res.status(404).json({
      error: 'Not Found',
      message: 'API key not found or not owned by you'
    });
  }
};

// Get usage metrics for a specific key
exports.getKeyMetrics = async (req, res) => {
  try {
    const userId = req.userId;
    const keyId = req.params.id;
    
    // Ensure the key belongs to this user
    await keyManagementService.getKeyById(keyId, userId);
    
    const { startDate, endDate } = req.query;
    const options = {};
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const metrics = await metricsService.getKeyMetrics(keyId, userId, options);
    
    res.json({ metrics });
  } catch (error) {
    logger.error(`Error getting metrics for key ${req.params.id}:`, error);
    res.status(404).json({
      error: 'Not Found',
      message: 'API key not found or not owned by you'
    });
  }
};
