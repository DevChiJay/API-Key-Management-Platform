const express = require('express');
const router = express.Router();
const ApiCatalog = require('../models/ApiCatalog');
const { requireAuth, getCurrentUser } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all available APIs (public endpoint)
router.get('/', async (req, res) => {
  try {
    const apis = await ApiCatalog.find({ isActive: true });
    
    // Return only public information
    const apiList = apis.map(api => ({
      id: api._id,
      name: api.name,
      slug: api.slug,
      description: api.description,
      documentation: api.documentation
    }));
    
    res.json({ apis: apiList });
  } catch (error) {
    logger.error('Error fetching API catalog:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API catalog'
    });
  }
});

// Get a specific API by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    // Try to find by ID first, then by slug
    let api = await ApiCatalog.findOne({
      $or: [
        { _id: idOrSlug },
        { slug: idOrSlug.toLowerCase() }
      ],
      isActive: true
    });
    
    if (!api) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API not found'
      });
    }
    
    res.json({
      id: api._id,
      name: api.name,
      slug: api.slug,
      description: api.description,
      baseUrl: api.baseUrl,
      endpoints: api.endpoints,
      documentation: api.documentation,
      authType: api.authType,
      defaultRateLimit: api.defaultRateLimit
    });
  } catch (error) {
    logger.error(`Error fetching API ${req.params.idOrSlug}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API details'
    });
  }
});

// The following routes require authentication
router.use(requireAuth);

// Add a new API to the catalog (admin only)
router.post('/', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    
    // In a real application, check if user is an admin
    // For now, assuming any authenticated user can add APIs
    
    const {
      name,
      slug,
      description,
      baseUrl,
      endpoints,
      documentation,
      authType,
      defaultRateLimit
    } = req.body;
    
    // Validation
    if (!name || !slug || !description || !baseUrl) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing required fields: name, slug, description, baseUrl'
      });
    }
    
    // Check if API with this slug already exists
    const existingApi = await ApiCatalog.findOne({ slug: slug.toLowerCase() });
    
    if (existingApi) {
      return res.status(409).json({
        error: 'Conflict',
        message: `API with slug '${slug}' already exists`
      });
    }
    
    // Create the new API
    const newApi = new ApiCatalog({
      name,
      slug: slug.toLowerCase(),
      description,
      baseUrl,
      endpoints: endpoints || [],
      documentation,
      authType: authType || 'apiKey',
      defaultRateLimit
    });
    
    await newApi.save();
    
    logger.info(`User ${user.id} created new API: ${name}`);
    
    res.status(201).json({
      id: newApi._id,
      name: newApi.name,
      slug: newApi.slug,
      message: 'API added to catalog successfully'
    });
  } catch (error) {
    logger.error('Error creating API:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add API to catalog'
    });
  }
});

// Update an API (admin only)
router.put('/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    
    // In a real application, check if user is an admin
    
    const apiId = req.params.id;
    const {
      name,
      description,
      baseUrl,
      endpoints,
      documentation,
      authType,
      defaultRateLimit,
      isActive
    } = req.body;
    
    const api = await ApiCatalog.findById(apiId);
    
    if (!api) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API not found'
      });
    }
    
    // Update fields
    if (name) api.name = name;
    if (description) api.description = description;
    if (baseUrl) api.baseUrl = baseUrl;
    if (endpoints) api.endpoints = endpoints;
    if (documentation) api.documentation = documentation;
    if (authType) api.authType = authType;
    if (defaultRateLimit) api.defaultRateLimit = defaultRateLimit;
    if (isActive !== undefined) api.isActive = isActive;
    
    api.updatedAt = Date.now();
    
    await api.save();
    
    logger.info(`User ${user.id} updated API ${apiId}`);
    
    res.json({
      id: api._id,
      name: api.name,
      message: 'API updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating API ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update API'
    });
  }
});

// Delete an API (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = getCurrentUser(req);
    
    // In a real application, check if user is an admin
    
    const apiId = req.params.id;
    
    const api = await ApiCatalog.findById(apiId);
    
    if (!api) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'API not found'
      });
    }
    
    // Instead of hard deleting, set isActive to false
    api.isActive = false;
    await api.save();
    
    logger.info(`User ${user.id} deactivated API ${apiId}`);
    
    res.json({
      message: 'API deactivated successfully'
    });
  } catch (error) {
    logger.error(`Error deactivating API ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to deactivate API'
    });
  }
});

module.exports = router;