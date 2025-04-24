const express = require('express');
const router = express.Router();
const keyManagementService = require('../services/keyManagement');
const metricsService = require('../services/metricsService');
const { requireAuth, getCurrentUser } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply authentication to all API key routes
router.use(requireAuth);

// Get all keys for the authenticated user
router.get('/', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const keys = await keyManagementService.getUserKeys(user.id);
    
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
});

// Get a specific key by ID
router.get('/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const key = await keyManagementService.getKeyById(req.params.id, user.id);
    
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
});

// Generate a new API key
router.post('/', async (req, res) => {
  try {
    const { apiId, name, permissions, rateLimit, expiresAt } = req.body;
    
    if (!apiId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'API ID is required'
      });
    }
    
    const user = getCurrentUser(req);
    const keyData = { apiId, name, permissions, rateLimit, expiresAt };
    
    const newKey = await keyManagementService.generateKey(user.id, keyData);
    
    logger.info(`User ${user.id} created new API key for API ID ${apiId}`);
    
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
});

// Revoke an API key
router.post('/:id/revoke', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const keyId = req.params.id;
    
    const revokedKey = await keyManagementService.revokeKey(keyId, user.id);
    
    logger.info(`User ${user.id} revoked API key ${keyId}`);
    
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
});

// Update an API key
router.put('/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const keyId = req.params.id;
    const { name, status, permissions, rateLimit, expiresAt } = req.body;
    
    const updatedKey = await keyManagementService.updateKey(keyId, user.id, {
      name, status, permissions, rateLimit, expiresAt
    });
    
    logger.info(`User ${user.id} updated API key ${keyId}`);
    
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
});

// Get usage metrics for a specific key
router.get('/:id/metrics', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    const keyId = req.params.id;
    
    // Ensure the key belongs to this user
    await keyManagementService.getKeyById(keyId, user.id);
    
    const { startDate, endDate } = req.query;
    const options = {};
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const metrics = await metricsService.getKeyMetrics(keyId, user.id, options);
    
    res.json({ metrics });
  } catch (error) {
    logger.error(`Error getting metrics for key ${req.params.id}:`, error);
    res.status(404).json({
      error: 'Not Found',
      message: 'API key not found or not owned by you'
    });
  }
});

module.exports = router;