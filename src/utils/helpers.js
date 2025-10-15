/**
 * Helper utility functions
 */

/**
 * Calculate cost based on waste type and quantity
 * @param {String} wasteType - Type of waste
 * @param {String} quantity - Quantity description
 * @returns {Number} Estimated cost in LKR
 */
exports.calculateCost = (wasteType, quantity) => {
  const rates = {
    household: 0, // Free
    recyclable: 0, // Free
    'e-waste': 0, // Free
    bulky: 500 // LKR per item
  };
  
  if (wasteType === 'bulky') {
    // Parse quantity (e.g., "2 items", "1 piece")
    const match = quantity.match(/\d+/);
    const items = match ? parseInt(match[0]) : 1;
    return rates.bulky * items;
  }
  
  return rates[wasteType] || 0;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in kilometers
 */
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Convert degrees to radians
 * @param {Number} degrees
 * @returns {Number} Radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {String} Formatted date
 */
exports.formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time to readable string
 * @param {Date} date - Date object
 * @returns {String} Formatted date and time
 */
exports.formatDateTime = (date) => {
  if (!date) return null;
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculate estimated duration for route based on distance and number of stops
 * @param {Number} distance - Total distance in km
 * @param {Number} stops - Number of stops
 * @returns {Number} Estimated duration in minutes
 */
exports.calculateRouteDuration = (distance, stops) => {
  const avgSpeedKmPerHour = 30; // Average urban speed
  const timePerStopMinutes = 5; // Time spent at each stop
  
  const drivingTime = (distance / avgSpeedKmPerHour) * 60; // Convert to minutes
  const stopTime = stops * timePerStopMinutes;
  
  return Math.round(drivingTime + stopTime);
};

/**
 * Generate tracking ID
 * @param {String} prefix - Prefix for tracking ID
 * @returns {String} Tracking ID
 */
exports.generateTrackingId = (prefix = 'TRK') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Sanitize sensitive data from object
 * @param {Object} obj - Object to sanitize
 * @param {Array} sensitiveFields - Fields to sanitize
 * @returns {Object} Sanitized object
 */
exports.sanitizeSensitiveData = (obj, sensitiveFields = ['password', 'token', 'apiKey', 'secret']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
};

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {Boolean}
 */
exports.isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Check if date is in the past
 * @param {Date} date - Date to check
 * @returns {Boolean}
 */
exports.isPastDate = (date) => {
  return new Date(date) < new Date();
};

