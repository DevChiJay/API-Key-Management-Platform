const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
  apiKeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  apiId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiCatalog',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  requestData: {
    type: Object
  },
  responseStatus: {
    type: Number
  },
  responseTime: {
    type: Number // in milliseconds
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for querying by apiKeyId and timestamp
UsageLogSchema.index({ apiKeyId: 1, timestamp: -1 });
// Index for metrics and reporting
UsageLogSchema.index({ apiId: 1, timestamp: -1 });

module.exports = mongoose.model('UsageLog', UsageLogSchema);