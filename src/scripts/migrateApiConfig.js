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
  github: {
    name: 'GitHub API',
    slug: 'github',
    description: 'GitHub REST API for accessing GitHub resources',
    baseUrl: 'https://api.github.com',
    endpoints: [
      { path: '/users/:username', method: 'GET', description: 'Get a user' },
      { path: '/repos/:owner/:repo', method: 'GET', description: 'Get a repository' },
      { path: '/search/repositories', method: 'GET', description: 'Search repositories' }
    ],
    documentation: 'https://docs.github.com/en/rest',
    authType: 'apiKey',
    gatewayConfig: {
      requiresAuth: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
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
