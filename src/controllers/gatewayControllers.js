const apis = require('../config/apis');
const { createApiProxy } = require('../middleware/proxy');
const logger = require('../utils/logger');

// Handle API routing
exports.routeApiRequest = (req, res, next) => {
  const { apiName } = req.params;
  const apiConfig = apis[apiName];

  if (!apiConfig) {
    logger.warn(`Attempt to access unknown API: ${apiName}`);
    return res.status(404).json({
      error: 'Not Found',
      message: `API '${apiName}' not found`
    });
  }

  // Check if user's API key has access to this API
  if (req.apiKey.api.slug !== apiName) {
    logger.warn(`API key not authorized for ${apiName}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: `This API key does not have access to '${apiName}'`
    });
  }

  // Create and apply proxy for this API
  const apiProxy = createApiProxy(apiConfig);
  apiProxy(req, res, next);
};
