/**
 * Script to migrate static API configurations to the database
 * Run with: node src/scripts/migrateApiConfig.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ApiCatalog = require('../models/ApiCatalog');
const logger = require('../utils/logger');

// Static API configurations to migrate
const staticApis = {
  contact: {
    name: 'Contact Us API',
    slug: 'contact-us',
    description: 'Handle contact form submissions with ease by adding the endpoint to your form.',
    baseUrl: 'https://api.devchihub.com/portfolio',
    endpoints: [
      { path: '/contact-us', method: 'POST', description: 'Submit contact form' }
    ],
    documentation: 'https://api.devchihub.com/Docs/Contact-Us.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  shortener: {
    name: 'URL Shortener API',
    slug: 'url-shortener',
    description: 'Store and retrieve humor entries with moderation capabilities.',
    baseUrl: 'https://api.devchihub.com/url-shortener',
    endpoints: [
      { path: '/api/shorten', method: 'POST', description: 'Create a shortened URL with QR code' },
      { path: '/:shortCode', method: 'GET', description: 'Redirect to the original URL' },
      { path: '/api/:shortCode/qr', method: 'GET', description: 'Get the QR code for a shortened URL' },
      { path: '/api/:shortCode/expiration', method: 'PATCH', description: 'Update URL expiration date' },
      { path: '/api/:shortCode/stats', method: 'GET', description: 'Get usage statistics for a URL' },
      { path: '/api/:shortCode/status', method: 'PATCH', description: 'Update URL active/inactive status' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Url-Shortener.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  humor: {
    name: 'Dark Humor API',
    slug: 'humor',
    description: 'Store and retrieve humor entries with moderation capabilities.',
    baseUrl: 'https://api.devchihub.com/portfolio',
    endpoints: [
      { path: '/humor/random', method: 'GET', description: 'Generate Random Humor' },
      { path: '/humor/new/add-humor', method: 'POST', description: 'Add Humor' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Humor.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  invoice: {
    name: 'Invoice Generator',
    slug: 'invoice',
    description: 'Create, manage, and retrieve invoice with PDF generation and email capabilities.',
    baseUrl: 'https://api.devchihub.com/invoice',
    endpoints: [
      { path: '/api/:id', method: 'GET', description: 'Retrieve a specific invoice' },
      { path: '/api/:id/pdf', method: 'GET', description: 'Generate PDF for an invoice' },
      { path: '/api', method: 'POST', description: 'Create a new invoice' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Invoice.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  ratelimiter: {
    name: 'Rate Limiter As a Service',
    slug: 'rate-limiter',
    description: 'Create, manage, and monitor API keys with rate limiting capabilities.',
    baseUrl: 'https://api.devchihub.com/rate-limiter',
    endpoints: [
      { path: '/api/auth/register', method: 'POST', description: 'Register a new user account' },
      { path: '/api/auth/login', method: 'POST', description: 'Login to get JWT token' },
      { path: '/api/auth/profile', method: 'GET', description: 'Get authenticated user profile' },
      { path: '/api/keys', method: 'POST', description: 'Create a new API key' },
      { path: '/api/keys/validate', method: 'POST', description: 'Validate an API key' },
      { path: '/api/keys/:keyId', method: 'GET', description: 'Get details about a specific API key' },
      { path: '/api/keys/:keyId/stats', method: 'GET', description: 'Get usage statistics for an API key' },
      { path: '/api/keys/:keyId', method: 'PUT', description: 'Update an API key' },
      { path: '/api/keys/:keyId', method: 'DELETE', description: 'Delete an API key' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Rate-Limiter.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  resume: {
    name: 'JSON Resume Generator',
    slug: 'resume',
    description: 'Create, retrieve, update, and delete resumes with PDF export capabilities.',
    baseUrl: 'https://api.devchihub.com/resume',
    endpoints: [
      { path: '/api/', method: 'POST', description: 'Create or update a resume' },
      { path: '/api/:resumeId', method: 'GET', description: 'Get resume by ID' },
      { path: '/api/', method: 'GET', description: 'Get resume by user ID' },
      { path: '/api/:resumeId', method: 'DELETE', description: 'Delete resume by ID' },
      { path: '/api/', method: 'DELETE', description: 'Delete resume by user ID' },
      { path: '/api/pdf', method: 'POST', description: 'Generate and download resume as PDF' },
      { path: '/api/:resumeId/pdf', method: 'GET', description: 'Preview resume PDF by resume ID' },
      { path: '/api/pdf/preview', method: 'GET', description: 'Preview resume PDF by user ID' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Resume.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  monitor: {
    name: 'Uptime Monitor API',
    slug: 'monitor',
    description: 'Monitor websites and API endpoints with customizable check intervals, track performance, and receive notifications.',
    baseUrl: 'https://api.devchihub.com/uptime-monitor',
    endpoints: [
      { path: '/health', method: 'GET', description: 'Check API health status' },
      { path: '/statistics', method: 'GET', description: 'Get all monitors' },
      { path: '/statistics/overall', method: 'GET', description: 'Get overall statistics' },
      { path: '/statistics/:id', method: 'GET', description: 'Get specific monitor statistics' },
      { path: '/monitors', method: 'POST', description: 'Create a new monitor' },
    ],
    documentation: 'https://api.devchihub.com/Docs/Uptime-Monitor.md', // Updated documentation link
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      }
    }
  },
  weather: {
    name: 'OpenWeather API',
    slug: 'weather',
    description: 'API for current weather and forecasts',
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    endpoints: [
      { path: '/weather', method: 'GET', description: 'Current weather data' },
      { path: '/forecast', method: 'GET', description: '5 day weather forecast' },
      { path: '/onecall', method: 'GET', description: 'Current and forecast weather data' }
    ],
    documentation: 'https://openweathermap.org/api',
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 1000 // limit each IP to 1000 requests per windowMs
      }
    }
  }
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('MongoDB Connected');
    return true;
  } catch (error) {
    logger.error('MongoDB Connection Error:', error);
    return false;
  }
};

// Migrate API configurations
const migrateApis = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      return;
    }

    logger.info('Starting API configuration migration...');
    
    for (const [slug, apiConfig] of Object.entries(staticApis)) {
      // Check if API already exists
      const existingApi = await ApiCatalog.findOne({ slug });
      
      if (existingApi) {
        logger.info(`API with slug '${slug}' already exists, updating...`);
        
        // Update existing API
        Object.assign(existingApi, apiConfig);
        await existingApi.save();
        
        logger.info(`Updated API: ${apiConfig.name}`);
      } else {
        logger.info(`API with slug '${slug}' not found, creating...`);
        
        // Create new API
        const newApi = new ApiCatalog(apiConfig);
        await newApi.save();
        
        logger.info(`Created API: ${apiConfig.name}`);
      }
    }
    
    logger.info('API configuration migration completed successfully');
  } catch (error) {
    logger.error('Error during API migration:', error);
  } finally {
    // Close database connection
    mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Run the migration
migrateApis();
