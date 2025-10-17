const SmartBin = require("../models/SmartBin.model");
const { successResponse, errorResponse } = require("../utils/response");
const { buildPaginationResponse } = require("../middleware/queryBuilder");

/**
 * Get all bins with filtering and pagination
 * GET /api/bins
 */
exports.getAllBins = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;

    const sortOrder = Object.keys(sort).length > 0 ? sort : { fillLevel: -1 };

    const [bins, total] = await Promise.all([
      SmartBin.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate("deviceId", "deviceId status batteryLevel"),
      SmartBin.countDocuments(req.dbQuery),
    ]);

    // Add virtual fields to response
    const binsWithStatus = bins.map((bin) => ({
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    }));

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      binsWithStatus,
      "Bins retrieved successfully",
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching bins:", error);
    return errorResponse(res, "Failed to retrieve bins", 500);
  }
};

/**
 * Get bin by ID
 * GET /api/bins/:id
 */
exports.getBinById = async (req, res) => {
  try {
    const bin = await SmartBin.findById(req.params.id).populate(
      "deviceId",
      "deviceId status batteryLevel lastPing"
    );

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    // Add virtual fields
    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    return successResponse(res, binData, "Bin retrieved successfully");
  } catch (error) {
    console.error("Error fetching bin:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    return errorResponse(res, "Failed to retrieve bin", 500);
  }
};

/**
 * Create new bin
 * POST /api/bins
 */
exports.createBin = async (req, res) => {
  try {
    const {
      binId,
      location,
      capacity,
      binType,
      status,
      fillLevel,
      deviceId,
    } = req.body;

    // Validate required fields
    if (!binId || !location || !location.coordinates) {
      return errorResponse(
        res,
        "Missing required fields: binId, location with coordinates (lat, lng)",
        400
      );
    }

    if (!location.coordinates.lat || !location.coordinates.lng) {
      return errorResponse(
        res,
        "Location coordinates must include lat and lng",
        400
      );
    }

    // Check if binId already exists
    const existingBin = await SmartBin.findOne({ binId });
    if (existingBin) {
      return errorResponse(res, "Bin ID already exists", 409);
    }

    // Create new bin
    const bin = await SmartBin.create({
      binId,
      location,
      capacity: capacity || 240,
      binType: binType || "general",
      status: status || "active",
      fillLevel: fillLevel || 0,
      deviceId: deviceId || null,
      lastUpdated: new Date(),
    });

    // Populate device info if exists
    await bin.populate("deviceId", "deviceId status batteryLevel");

    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    return successResponse(res, binData, "Bin created successfully", 201);
  } catch (error) {
    console.error("Error creating bin:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse(res, "Bin ID already exists", 409);
    }

    return errorResponse(res, "Failed to create bin", 500);
  }
};

/**
 * Update bin
 * PUT /api/bins/:id
 */
exports.updateBin = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent updating the unique binId
    if (updates.binId) {
      delete updates.binId;
    }

    // Check if there are fields to update
    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No valid fields provided for update", 400);
    }

    // Set lastUpdated
    updates.lastUpdated = new Date();

    // Find and update bin
    const bin = await SmartBin.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("deviceId", "deviceId status batteryLevel lastPing");

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    return successResponse(res, binData, "Bin updated successfully");
  } catch (error) {
    console.error("Error updating bin:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    return errorResponse(res, "Failed to update bin", 500);
  }
};

/**
 * Update bin fill level
 * PUT /api/bins/:id/fill-level
 */
exports.updateFillLevel = async (req, res) => {
  try {
    const { fillLevel } = req.body;

    if (fillLevel === undefined || fillLevel === null) {
      return errorResponse(res, "Fill level is required", 400);
    }

    if (fillLevel < 0 || fillLevel > 100) {
      return errorResponse(res, "Fill level must be between 0 and 100", 400);
    }

    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    // Use the model method to update fill level (auto-updates status)
    await bin.updateFillLevel(fillLevel);

    await bin.populate("deviceId", "deviceId status batteryLevel");

    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    return successResponse(res, binData, "Fill level updated successfully");
  } catch (error) {
    console.error("Error updating fill level:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    return errorResponse(res, "Failed to update fill level", 500);
  }
};

/**
 * Empty bin (set fill level to 0)
 * PUT /api/bins/:id/empty
 */
exports.emptyBin = async (req, res) => {
  try {
    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    // Use the model method to empty bin
    await bin.empty();

    await bin.populate("deviceId", "deviceId status batteryLevel");

    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    return successResponse(res, binData, "Bin emptied successfully");
  } catch (error) {
    console.error("Error emptying bin:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    return errorResponse(res, "Failed to empty bin", 500);
  }
};

/**
 * Set bin maintenance status
 * PUT /api/bins/:id/maintenance
 */
exports.setMaintenance = async (req, res) => {
  try {
    const { isMaintenance } = req.body;

    if (isMaintenance === undefined || isMaintenance === null) {
      return errorResponse(res, "isMaintenance field is required", 400);
    }

    const bin = await SmartBin.findById(req.params.id);

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    // Use the model method to set maintenance
    await bin.setMaintenance(isMaintenance);

    await bin.populate("deviceId", "deviceId status batteryLevel");

    const binData = {
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent,
    };

    const message = isMaintenance
      ? "Bin set to maintenance mode"
      : "Bin returned to active status";

    return successResponse(res, binData, message);
  } catch (error) {
    console.error("Error setting maintenance:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    return errorResponse(res, "Failed to set maintenance status", 500);
  }
};

/**
 * Delete bin
 * DELETE /api/bins/:id
 */
exports.deleteBin = async (req, res) => {
  try {
    const bin = await SmartBin.findByIdAndDelete(req.params.id);

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    return successResponse(
      res,
      { id: req.params.id, binId: bin.binId },
      "Bin deleted successfully"
    );
  } catch (error) {
    console.error("Error deleting bin:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid bin ID", 400);
    }

    return errorResponse(res, "Failed to delete bin", 500);
  }
};

