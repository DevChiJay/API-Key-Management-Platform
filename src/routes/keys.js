const express = require('express');
const router = express.Router();
const keysController = require('../controllers/keysControllers');
const { requireAuth } = require('../middleware/auth');

// Apply authentication to all API key routes
router.use(requireAuth);

// Get all keys for the authenticated user
router.get('/', keysController.getUserKeys);

// Get a specific key by ID
router.get('/:id', keysController.getKeyById);

// Generate a new API key
router.post('/', keysController.generateKey);

// Revoke an API key
router.post('/:id/revoke', keysController.revokeKey);

// Update an API key
router.put('/:id', keysController.updateKey);

// Get usage metrics for a specific key
router.get('/:id/metrics', keysController.getKeyMetrics);

module.exports = router;