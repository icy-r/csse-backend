const User = require("../models/User.model");
const { successResponse, errorResponse } = require("../utils/response");
const { buildPaginationResponse } = require("../middleware/queryBuilder");

/**
 * Get all users with filtering and pagination
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;

    const sortOrder = Object.keys(sort).length > 0 ? sort : { createdAt: -1 };

    const [users, total] = await Promise.all([
      User.find(req.dbQuery)
        .select("-password -__v")
        .sort(sortOrder)
        .skip(skip)
        .limit(limit),
      User.countDocuments(req.dbQuery),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(res, users, "Users retrieved successfully", 200, pagination);
  } catch (error) {
    console.error("Error fetching users:", error);
    return errorResponse(res, "Failed to retrieve users", 500);
  }
};

/**
 * Get user by ID
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -__v");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, user, "User retrieved successfully");
  } catch (error) {
    console.error("Error fetching user:", error);
    
    // Handle invalid ObjectId
    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid user ID", 400);
    }
    
    return errorResponse(res, "Failed to retrieve user", 500);
  }
};

/**
 * Create new user
 * POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, address, status } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return errorResponse(
        res,
        "Missing required fields: name, email, phone, password",
        400
      );
    }

    // Validate password length
    if (password.length < 6) {
      return errorResponse(
        res,
        "Password must be at least 6 characters long",
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email already registered", 409);
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || "citizen",
      address: address || {},
      status: status || "active",
    });

    // Return user data without password
    const userData = await User.findById(user._id).select("-password -__v");

    return successResponse(res, userData, "User created successfully", 201);
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, "Email already registered", 409);
    }

    return errorResponse(res, "Failed to create user", 500);
  }
};

/**
 * Update user (email updates blocked)
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { email, password, ...updateData } = req.body;

    // Block email updates
    if (email) {
      return errorResponse(
        res,
        "Email cannot be updated. Please contact support if you need to change your email.",
        403
      );
    }

    // Block password updates through this endpoint
    if (password) {
      return errorResponse(
        res,
        "Password cannot be updated through this endpoint. Use a dedicated password change endpoint.",
        403
      );
    }

    // Check if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No valid fields provided for update", 400);
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -__v");

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, user, "User updated successfully");
  } catch (error) {
    console.error("Error updating user:", error);

    // Handle invalid ObjectId
    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid user ID", 400);
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    return errorResponse(res, "Failed to update user", 500);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(
      res,
      { id: req.params.id },
      "User deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting user:", error);

    // Handle invalid ObjectId
    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid user ID", 400);
    }

    return errorResponse(res, "Failed to delete user", 500);
  }
};

