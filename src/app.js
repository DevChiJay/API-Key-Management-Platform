const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/apis');
const keyRoutes = require('./routes/keys');
const gatewayRoutes = require('./routes/gateway');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Request logging
app.use(logger.httpLogger);

// Parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/keys', keyRoutes);
app.use('/gateway', gatewayRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'API Key Management Platform',
    documentation: '/api/docs',
    version: '1.0.0'
  });
});

// Basic documentation route
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'API Key Management Platform Documentation',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Log in a user',
        'GET /api/auth/me': 'Get current user profile (requires auth)'
      },
      apis: {
        'GET /api/apis': 'Get all available APIs',
        'GET /api/apis/:idOrSlug': 'Get details for a specific API',
        'POST /api/apis': 'Add a new API (requires auth)',
        'PUT /api/apis/:id': 'Update an API (requires auth)',
        'DELETE /api/apis/:id': 'Deactivate an API (requires auth)'
      },
      keys: {
        'GET /api/keys': 'Get all your API keys (requires auth)',
        'GET /api/keys/:id': 'Get a specific API key (requires auth)',
        'POST /api/keys': 'Generate a new API key (requires auth)',
        'PUT /api/keys/:id': 'Update an API key (requires auth)',
        'POST /api/keys/:id/revoke': 'Revoke an API key (requires auth)',
        'GET /api/keys/:id/metrics': 'Get usage metrics for a key (requires auth)'
      },
      gateway: {
        'ALL /gateway/:apiName/*': 'Make requests to external APIs (requires API key)'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

module.exports = app;