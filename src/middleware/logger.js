/**
 * Request/Response Logger Middleware
 * Logs all API requests and emits them via Socket.IO for real-time monitoring
 */

const socketLogger = require('../services/socketLogger.service');
const { sanitizeSensitiveData } = require('../utils/helpers');

const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original send function
  const originalSend = res.send;
  
  // Override send function to capture response
  res.send = function(data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    
    // Try to parse response data
    let responseData = null;
    try {
      if (typeof data === 'string') {
        responseData = JSON.parse(data);
      } else if (typeof data === 'object') {
        responseData = data;
      }
    } catch (e) {
      responseData = { raw: String(data).substring(0, 200) };
    }
    
    // Build log entry
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      fullUrl: req.originalUrl,
      query: req.query,
      body: sanitizeSensitiveData(req.body),
      response: responseData,
      status: res.statusCode,
      statusText: getStatusText(res.statusCode),
      duration: `${duration}ms`,
      durationMs: duration,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };
    
    // Determine log level based on status code
    if (res.statusCode >= 500) {
      logEntry.level = 'error';
    } else if (res.statusCode >= 400) {
      logEntry.level = 'warn';
    } else {
      logEntry.level = 'info';
    }
    
    // Console log
    const emoji = getEmoji(res.statusCode);
    const colorCode = getColorCode(res.statusCode);
    console.log(
      `${emoji} ${colorCode}${req.method}${resetColor} ${req.path} - ` +
      `${getStatusColor(res.statusCode)}${res.statusCode}${resetColor} - ${duration}ms`
    );
    
    // Emit to connected Socket.IO clients
    socketLogger.emit('log', logEntry);
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Get emoji based on status code
 */
function getEmoji(statusCode) {
  if (statusCode >= 500) return '❌';
  if (statusCode >= 400) return '⚠️';
  if (statusCode >= 300) return '🔀';
  if (statusCode >= 200) return '✅';
  return '📝';
}

/**
 * Get status text description
 */
function getStatusText(statusCode) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  return statusTexts[statusCode] || 'Unknown';
}

/**
 * ANSI color codes for console output
 */
const resetColor = '\x1b[0m';

function getColorCode(statusCode) {
  if (statusCode >= 500) return '\x1b[31m'; // Red
  if (statusCode >= 400) return '\x1b[33m'; // Yellow
  if (statusCode >= 300) return '\x1b[36m'; // Cyan
  if (statusCode >= 200) return '\x1b[32m'; // Green
  return '\x1b[37m'; // White
}

function getStatusColor(statusCode) {
  if (statusCode >= 500) return '\x1b[41m\x1b[37m'; // Red background, white text
  if (statusCode >= 400) return '\x1b[43m\x1b[30m'; // Yellow background, black text
  if (statusCode >= 300) return '\x1b[46m\x1b[30m'; // Cyan background, black text
  if (statusCode >= 200) return '\x1b[42m\x1b[30m'; // Green background, black text
  return '\x1b[47m\x1b[30m'; // White background, black text
}

module.exports = logger;

