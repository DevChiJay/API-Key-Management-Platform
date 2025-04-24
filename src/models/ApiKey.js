const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String,
    required: true,
    unique: true
  },
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiCatalog',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'revoked'],
    default: 'active'
  },
  permissions: {
    type: [String],
    default: ['read']
  },
  rateLimit: {
    requests: {
      type: Number,
      default: 100
    },
    per: {
      type: Number,
      default: 60 * 60 * 1000 // 1 hour in milliseconds
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);