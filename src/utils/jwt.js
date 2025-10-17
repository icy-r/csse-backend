const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {String} userId - User ID
 * @param {String} email - User email
 * @param {String} role - User role
 * @returns {String} JWT token
 */
exports.generateToken = (userId, email, role) => {
  const payload = {
    id: userId,
    email: email,
    role: role
  };
  
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  return jwt.verify(token, secret);
};

