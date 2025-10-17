const Device = require("../models/Device.model");
const SmartBin = require("../models/SmartBin.model");
const { successResponse, errorResponse } = require("../utils/response");
const { buildPaginationResponse } = require("../middleware/queryBuilder");

/**
 * Get all devices with filtering and pagination
 * GET /api/devices
 */
exports.getAllDevices = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;

    const sortOrder = Object.keys(sort).length > 0 ? sort : { createdAt: -1 };

    const [devices, total] = await Promise.all([
      Device.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate("binId", "binId location status fillLevel")
        .populate("maintenanceHistory.technicianId", "name")
        .populate("maintenanceHistory.workOrderId", "workOrderId status"),
      Device.countDocuments(req.dbQuery),
    ]);

    // Add virtual fields to response
    const devicesWithStatus = devices.map((device) => ({
      ...device.toObject(),
      daysSinceLastSignal: device.daysSinceLastSignal,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
    }));

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      devicesWithStatus,
      "Devices retrieved successfully",
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching devices:", error);
    return errorResponse(res, "Failed to retrieve devices", 500);
  }
};

/**
 * Get device by ID
 * GET /api/devices/:id
 */
exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id)
      .populate("binId", "binId location status fillLevel")
      .populate("maintenanceHistory.technicianId", "name email phone")
      .populate("maintenanceHistory.workOrderId", "workOrderId status priority");

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    // Add virtual fields
    const deviceData = {
      ...device.toObject(),
      daysSinceLastSignal: device.daysSinceLastSignal,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
    };

    return successResponse(res, deviceData, "Device retrieved successfully");
  } catch (error) {
    console.error("Error fetching device:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to retrieve device", 500);
  }
};

/**
 * Create new device
 * POST /api/devices
 */
exports.createDevice = async (req, res) => {
  try {
    const {
      deviceId,
      deviceType,
      binId,
      status,
      batteryLevel,
      firmwareVersion,
    } = req.body;

    // Validate required fields
    if (!deviceId || !deviceType) {
      return errorResponse(
        res,
        "Missing required fields: deviceId, deviceType",
        400
      );
    }

    // Check if deviceId already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return errorResponse(res, "Device ID already exists", 409);
    }

    // Validate bin exists if binId provided
    if (binId) {
      const bin = await SmartBin.findById(binId);
      if (!bin) {
        return errorResponse(res, "Bin not found", 404);
      }
    }

    // Create new device
    const device = await Device.create({
      deviceId,
      deviceType,
      binId: binId || null,
      status: status || "active",
      batteryLevel: batteryLevel || null,
      firmwareVersion: firmwareVersion || null,
      installationDate: new Date(),
      lastSignal: new Date(),
    });

    // Populate the created device
    await device.populate("binId", "binId location status");

    const deviceData = {
      ...device.toObject(),
      daysSinceLastSignal: device.daysSinceLastSignal,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
    };

    return successResponse(res, deviceData, "Device created successfully", 201);
  } catch (error) {
    console.error("Error creating device:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    if (error.code === 11000) {
      return errorResponse(res, "Device ID already exists", 409);
    }

    return errorResponse(res, "Failed to create device", 500);
  }
};

/**
 * Update device
 * PUT /api/devices/:id
 */
exports.updateDevice = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent updating certain fields directly
    delete updates.deviceId; // deviceId is immutable
    delete updates.installationDate;
    delete updates.errorLog;
    delete updates.maintenanceHistory;

    // Validate bin exists if binId provided
    if (updates.binId) {
      const bin = await SmartBin.findById(updates.binId);
      if (!bin) {
        return errorResponse(res, "Bin not found", 404);
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No valid fields provided for update", 400);
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("binId", "binId location status fillLevel");

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    const deviceData = {
      ...device.toObject(),
      daysSinceLastSignal: device.daysSinceLastSignal,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
    };

    return successResponse(res, deviceData, "Device updated successfully");
  } catch (error) {
    console.error("Error updating device:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    return errorResponse(res, "Failed to update device", 500);
  }
};

/**
 * Update device signal (heartbeat)
 * PUT /api/devices/:id/signal
 */
exports.updateSignal = async (req, res) => {
  try {
    const { batteryLevel } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    // Use the model method to update signal
    await device.updateSignal(batteryLevel);

    const deviceData = {
      deviceId: device.deviceId,
      status: device.status,
      lastSignal: device.lastSignal,
      batteryLevel: device.batteryLevel,
      isOnline: device.isOnline,
      batteryStatus: device.batteryStatus,
    };

    return successResponse(res, deviceData, "Device signal updated successfully");
  } catch (error) {
    console.error("Error updating device signal:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to update device signal", 500);
  }
};

/**
 * Add error log to device
 * POST /api/devices/:id/error
 */
exports.addError = async (req, res) => {
  try {
    const { errorCode, description, severity } = req.body;

    if (!errorCode || !description) {
      return errorResponse(
        res,
        "Missing required fields: errorCode, description",
        400
      );
    }

    const device = await Device.findById(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    // Use the model method to add error
    await device.addError(errorCode, description, severity || "medium");

    // Set device status to error if it's a critical error
    if (severity === "critical" && device.status === "active") {
      device.status = "error";
      await device.save();
    }

    const errorEntry = device.errorLog[device.errorLog.length - 1];

    return successResponse(res, {
      deviceId: device.deviceId,
      status: device.status,
      errorEntry,
      totalErrors: device.errorLog.length,
    }, "Error logged successfully");
  } catch (error) {
    console.error("Error adding device error:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to log error", 500);
  }
};

/**
 * Add maintenance record to device
 * POST /api/devices/:id/maintenance
 */
exports.addMaintenance = async (req, res) => {
  try {
    const { action, technicianId, notes, workOrderId } = req.body;

    if (!action || !technicianId || !notes) {
      return errorResponse(
        res,
        "Missing required fields: action, technicianId, notes",
        400
      );
    }

    const device = await Device.findById(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    // Use the model method to add maintenance
    await device.addMaintenance(action, technicianId, notes, workOrderId);

    await device.populate("maintenanceHistory.technicianId", "name");

    const maintenanceEntry = device.maintenanceHistory[device.maintenanceHistory.length - 1];

    return successResponse(res, {
      deviceId: device.deviceId,
      maintenanceEntry,
      totalMaintenanceRecords: device.maintenanceHistory.length,
    }, "Maintenance record added successfully");
  } catch (error) {
    console.error("Error adding maintenance record:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to add maintenance record", 500);
  }
};

/**
 * Decommission device
 * PUT /api/devices/:id/decommission
 */
exports.decommissionDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    if (device.status === "decommissioned") {
      return errorResponse(res, "Device is already decommissioned", 400);
    }

    // Use the model method to decommission
    await device.decommission();

    return successResponse(res, {
      deviceId: device.deviceId,
      status: device.status,
      binId: device.binId,
    }, "Device decommissioned successfully");
  } catch (error) {
    console.error("Error decommissioning device:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to decommission device", 500);
  }
};

/**
 * Reactivate device
 * PUT /api/devices/:id/reactivate
 */
exports.reactivateDevice = async (req, res) => {
  try {
    const { binId } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    if (device.status === "decommissioned") {
      return errorResponse(res, "Decommissioned devices cannot be reactivated", 400);
    }

    // Validate bin exists if binId provided
    if (binId) {
      const bin = await SmartBin.findById(binId);
      if (!bin) {
        return errorResponse(res, "Bin not found", 404);
      }
    }

    // Use the model method to reactivate
    await device.reactivate(binId);

    await device.populate("binId", "binId location status");

    const deviceData = {
      ...device.toObject(),
      daysSinceLastSignal: device.daysSinceLastSignal,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
    };

    return successResponse(res, deviceData, "Device reactivated successfully");
  } catch (error) {
    console.error("Error reactivating device:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    if (error.message === "Decommissioned devices cannot be reactivated") {
      return errorResponse(res, error.message, 400);
    }

    return errorResponse(res, "Failed to reactivate device", 500);
  }
};

/**
 * Delete device
 * DELETE /api/devices/:id
 */
exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    return successResponse(res, {
      id: req.params.id,
      deviceId: device.deviceId,
    }, "Device deleted successfully");
  } catch (error) {
    console.error("Error deleting device:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid device ID", 400);
    }

    return errorResponse(res, "Failed to delete device", 500);
  }
};
