const mongoose = require('mongoose');

const ApiCatalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  baseUrl: {
    type: String,
    required: true
  },
  endpoints: [{
    path: String,
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      default: 'GET'
    },
    description: String,
    requiresAuth: {
      type: Boolean,
      default: true
    }
  }],
  documentation: {
    type: String
  },
  authType: {
    type: String,
    enum: ['apiKey', 'oauth', 'basic', 'none'],
    default: 'apiKey'
  },
  defaultRateLimit: {
    requests: {
      type: Number,
      default: 100
    },
    per: {
      type: Number,
      default: 60 * 60 * 1000 // 1 hour in milliseconds
    }
  },
  gatewayConfig: {
    requiresAuth: {
      type: Boolean,
      default: true
    },
    rateLimit: {
      windowMs: {
        type: Number,
        default: 60 * 60 * 1000 // 1 hour in milliseconds
      },
      max: {
        type: Number,
        default: 100
      }
    },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    transformRequest: {
      type: String,
      default: null
    },
    transformResponse: {
      type: String,
      default: null
    },
    errorHandling: {
      type: Object,
      default: {}
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ApiCatalog', ApiCatalogSchema);