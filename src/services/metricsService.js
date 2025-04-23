const UsageLog = require('../models/UsageLog');
const logger = require('../utils/logger');

/**
 * Service for collecting and querying API usage metrics
 */
class MetricsService {
  /**
   * Get usage metrics for a specific user
   * @param {String} userId - User ID from Clerk
   * @param {Object} options - Query options (timeframe, etc.)
   * @returns {Object} Usage metrics
   */
  async getUserMetrics(userId, options = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = options;
      
      const metrics = await UsageLog.aggregate([
        {
          $match: {
            userId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { 
              apiKeyId: '$apiKeyId',
              day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            successCount: {
              $sum: {
                $cond: [{ $lt: ['$responseStatus', 400] }, 1, 0]
              }
            },
            errorCount: {
              $sum: {
                $cond: [{ $gte: ['$responseStatus', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $group: {
            _id: '$_id.apiKeyId',
            dailyUsage: {
              $push: {
                day: '$_id.day',
                count: '$count',
                avgResponseTime: '$avgResponseTime',
                successCount: '$successCount',
                errorCount: '$errorCount'
              }
            },
            totalRequests: { $sum: '$count' },
            avgResponseTime: { $avg: '$avgResponseTime' },
            totalSuccesses: { $sum: '$successCount' },
            totalErrors: { $sum: '$errorCount' }
          }
        },
        {
          $lookup: {
            from: 'apikeys',
            localField: '_id',
            foreignField: '_id',
            as: 'keyInfo'
          }
        },
        {
          $unwind: '$keyInfo'
        },
        {
          $lookup: {
            from: 'apicatalogs',
            localField: 'keyInfo.apiId',
            foreignField: '_id',
            as: 'apiInfo'
          }
        },
        {
          $unwind: '$apiInfo'
        },
        {
          $project: {
            _id: 1,
            keyName: '$keyInfo.name',
            apiName: '$apiInfo.name',
            dailyUsage: 1,
            totalRequests: 1,
            avgResponseTime: 1,
            totalSuccesses: 1,
            totalErrors: 1,
            successRate: {
              $cond: [
                { $eq: ['$totalRequests', 0] },
                0,
                { $multiply: [{ $divide: ['$totalSuccesses', '$totalRequests'] }, 100] }
              ]
            }
          }
        }
      ]);
      
      return metrics;
    } catch (error) {
      logger.error('Error retrieving user metrics:', error);
      throw error;
    }
  }

  /**
   * Get usage metrics for a specific API key
   * @param {String} keyId - API Key ID
   * @param {String} userId - User ID from Clerk (for access control)
   * @param {Object} options - Query options (timeframe, etc.)
   * @returns {Object} Usage metrics for the specific key
   */
  async getKeyMetrics(keyId, userId, options = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = options;
      
      const metrics = await UsageLog.aggregate([
        {
          $match: {
            apiKeyId: mongoose.Types.ObjectId(keyId),
            userId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              endpoint: '$endpoint',
              method: '$method'
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            successCount: {
              $sum: {
                $cond: [{ $lt: ['$responseStatus', 400] }, 1, 0]
              }
            },
            errorCount: {
              $sum: {
                $cond: [{ $gte: ['$responseStatus', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { '_id.day': -1, count: -1 }
        }
      ]);
      
      // Organize by endpoint and method
      const endpointMetrics = {};
      
      metrics.forEach(item => {
        const endpoint = item._id.endpoint;
        const method = item._id.method;
        const day = item._id.day;
        
        if (!endpointMetrics[endpoint]) {
          endpointMetrics[endpoint] = {};
        }
        
        if (!endpointMetrics[endpoint][method]) {
          endpointMetrics[endpoint][method] = {
            totalRequests: 0,
            totalSuccesses: 0,
            totalErrors: 0,
            avgResponseTime: 0,
            dailyUsage: []
          };
        }
        
        const current = endpointMetrics[endpoint][method];
        
        current.totalRequests += item.count;
        current.totalSuccesses += item.successCount;
        current.totalErrors += item.errorCount;
        current.avgResponseTime = (current.avgResponseTime + item.avgResponseTime) / 2;
        current.dailyUsage.push({
          day,
          count: item.count,
          successCount: item.successCount,
          errorCount: item.errorCount,
          avgResponseTime: item.avgResponseTime
        });
      });
      
      return endpointMetrics;
    } catch (error) {
      logger.error(`Error retrieving metrics for key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Get overall system usage metrics (admin only)
   * @param {Object} options - Query options (timeframe, etc.)
   * @returns {Object} System-wide usage metrics
   */
  async getSystemMetrics(options = {}) {
    try {
      const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = options;
      
      const metrics = await UsageLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              apiId: '$apiId'
            },
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            uniqueKeys: { $addToSet: '$apiKeyId' },
            avgResponseTime: { $avg: '$responseTime' },
            successCount: {
              $sum: {
                $cond: [{ $lt: ['$responseStatus', 400] }, 1, 0]
              }
            },
            errorCount: {
              $sum: {
                $cond: [{ $gte: ['$responseStatus', 400] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'apicatalogs',
            localField: '_id.apiId',
            foreignField: '_id',
            as: 'apiInfo'
          }
        },
        {
          $unwind: '$apiInfo'
        },
        {
          $sort: { '_id.day': -1 }
        },
        {
          $group: {
            _id: '$_id.apiId',
            apiName: { $first: '$apiInfo.name' },
            dailyUsage: {
              $push: {
                day: '$_id.day',
                count: '$count',
                uniqueUsers: { $size: '$uniqueUsers' },
                uniqueKeys: { $size: '$uniqueKeys' },
                avgResponseTime: '$avgResponseTime',
                successCount: '$successCount',
                errorCount: '$errorCount'
              }
            },
            totalRequests: { $sum: '$count' },
            avgResponseTime: { $avg: '$avgResponseTime' },
            totalSuccesses: { $sum: '$successCount' },
            totalErrors: { $sum: '$errorCount' }
          }
        }
      ]);
      
      return metrics;
    } catch (error) {
      logger.error('Error retrieving system metrics:', error);
      throw error;
    }
  }
}

module.exports = new MetricsService();