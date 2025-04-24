const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create write streams for logs
const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'), 
  { flags: 'a' }
);

// Create a custom Morgan format
morgan.token('user-id', (req) => (req.auth && req.auth.userId) ? req.auth.userId : 'anonymous');
morgan.token('api-key', (req) => (req.apiKey && req.apiKey.key) ? req.apiKey.key.substring(0, 8) + '...' : 'none');

const logger = {
  // Morgan middleware for HTTP request logging
  httpLogger: morgan(':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :api-key - :response-time ms', {
    stream: accessLogStream
  }),

  // Application logging methods
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

module.exports = logger;