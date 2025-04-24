const express = require('express');
const router = express.Router();
const apisController = require('../controllers/apisControllers');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all available APIs (public endpoint)
router.get('/', apisController.getAllApis);

// Get a specific API by ID or slug
router.get('/:idOrSlug', apisController.getApiByIdOrSlug);

// The following routes require authentication
router.use(requireAuth);

// Add a new API to the catalog (admin only)
router.post('/', requireAdmin, apisController.addApi);

// Update an API (admin only)
router.put('/:id', requireAdmin, apisController.updateApi);

// Delete an API (admin only)
router.delete('/:id', requireAdmin, apisController.deleteApi);

module.exports = router;