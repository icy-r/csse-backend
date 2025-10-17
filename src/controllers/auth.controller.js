const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/response');
const { generateToken } = require('../utils/jwt');

/**
 * User signup
 * POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return errorResponse(res, 'Missing required fields: name, email, phone, password', 400);
    }
    
    // Validate password length
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 409);
    }
    
    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'citizen', // Default to citizen
      address: address || {},
      status: 'active'
    });
    
    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);
    
    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      status: user.status,
      createdAt: user.createdAt
    };
    
    return successResponse(
      res,
      {
        token,
        user: userData
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return errorResponse(res, messages.join(', '), 400);
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, 'Email already registered', 409);
    }
    
    return errorResponse(res, 'Signup failed. Please try again.', 500);
  }
};

/**
 * User login
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return errorResponse(res, 'Account is inactive or suspended', 403);
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user._id, user.email, user.role);
    
    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      address: user.address,
      status: user.status,
      lastLogin: user.lastLogin
    };
    
    return successResponse(
      res,
      {
        token,
        user: userData
      },
      'Login successful'
    );
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

