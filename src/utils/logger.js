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

// Create debug log stream for rate limiting issues
const debugLogStream = fs.createWriteStream(
  path.join(logDirectory, 'debug.log'),
  { flags: 'a' }
);

// Create a custom Morgan format
morgan.token('user-id', (req) => (req.auth && req.auth.userId) ? req.auth.userId : 'anonymous');
morgan.token('api-key', (req) => (req.apiKey && req.apiKey.key) ? req.apiKey.key.substring(0, 8) + '...' : 'none');
morgan.token('rate-limit', (req) => {
  if (req.apiKey && req.apiKey.rateLimit) {
    return `${req.apiKey.rateLimit.requests}/${req.apiKey.rateLimit.per}ms`;
  }
  return 'none';
});

const logger = {
  // Morgan middleware for HTTP request logging
  httpLogger: morgan(':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :api-key - :rate-limit - :response-time ms', {
    stream: accessLogStream
  }),

  // Application logging methods
  info: (message, meta = {}) => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(logMessage, meta);
    if (Object.keys(meta).length > 0) {
      fs.appendFileSync(path.join(logDirectory, 'info.log'), `${logMessage} ${JSON.stringify(meta)}\n`);
    } else {
      fs.appendFileSync(path.join(logDirectory, 'info.log'), `${logMessage}\n`);
    }
  },
  
  warn: (message, meta = {}) => {
    const logMessage = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(logMessage, meta);
    if (Object.keys(meta).length > 0) {
      fs.appendFileSync(path.join(logDirectory, 'warn.log'), `${logMessage} ${JSON.stringify(meta)}\n`);
    } else {
      fs.appendFileSync(path.join(logDirectory, 'warn.log'), `${logMessage}\n`);
    }
  },
  
  error: (message, meta = {}) => {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message}`;
    console.error(logMessage, meta);
    if (Object.keys(meta).length > 0) {
      fs.appendFileSync(path.join(logDirectory, 'error.log'), `${logMessage} ${JSON.stringify(meta)}\n`);
    } else {
      fs.appendFileSync(path.join(logDirectory, 'error.log'), `${logMessage}\n`);
    }
  },
  
  debug: (message, meta = {}) => {
    // Always log rate limiting issues regardless of environment
    const logMessage = `[DEBUG] ${new Date().toISOString()} - ${message}`;
    
    if (process.env.NODE_ENV !== 'production' || message.includes('rate limit')) {
      console.debug(logMessage, meta);
      if (Object.keys(meta).length > 0) {
        fs.appendFileSync(path.join(logDirectory, 'debug.log'), `${logMessage} ${JSON.stringify(meta)}\n`);
      } else {
        fs.appendFileSync(path.join(logDirectory, 'debug.log'), `${logMessage}\n`);
      }
    }
  }
};

module.exports = logger;