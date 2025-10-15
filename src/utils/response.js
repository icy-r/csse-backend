/**
 * Standard response helpers for consistent API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @param {*} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} JSON response
 */
exports.successResponse = (res, message, data = null, statusCode = 200, pagination = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {*} errors - Additional error details
 * @returns {Object} JSON response
 */
exports.errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

