/**
 * Centralized error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists`,
      error: 'Duplicate key error'
    });
  }
  
  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      error: 'Cast error'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'Authentication error'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'Authentication error'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  const response = {
    success: false,
    message
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err.name;
  }
  
  res.status(statusCode).json(response);
};

module.exports = errorHandler;

