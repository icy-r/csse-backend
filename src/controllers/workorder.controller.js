const WorkOrder = require("../models/WorkOrder.model");
const Device = require("../models/Device.model");
const SmartBin = require("../models/SmartBin.model");
const { successResponse, errorResponse } = require("../utils/response");
const { buildPaginationResponse } = require("../middleware/queryBuilder");

/**
 * Get all work orders with filtering and pagination
 * GET /api/work-orders
 */
exports.getAllWorkOrders = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;

    // Default sort: priority desc, created asc
    const sortOrder = Object.keys(sort).length > 0 
      ? sort 
      : { priority: -1, createdAt: 1 };

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate("technicianId", "name phone email")
        .populate("deviceId", "deviceId deviceType status batteryLevel")
        .populate("binId", "binId location fillLevel status"),
      WorkOrder.countDocuments(req.dbQuery),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      workOrders,
      "Work orders retrieved successfully",
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching work orders:", error);
    return errorResponse(res, "Failed to retrieve work orders", 500);
  }
};

/**
 * Get work order by ID
 * GET /api/work-orders/:id
 */
exports.getWorkOrderById = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate("technicianId", "name phone email")
      .populate({
        path: "deviceId",
        select: "deviceId deviceType status batteryLevel errorLog maintenanceHistory",
        populate: {
          path: "maintenanceHistory.technicianId",
          select: "name",
        },
      })
      .populate("binId", "binId location fillLevel status")
      .populate("newDeviceId", "deviceId deviceType status");

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    // Add virtual fields
    const workOrderData = {
      ...workOrder.toObject(),
      daysSinceCreated: workOrder.daysSinceCreated,
      resolutionTime: workOrder.resolutionTime,
    };

    return successResponse(res, workOrderData, "Work order retrieved successfully");
  } catch (error) {
    console.error("Error fetching work order:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid work order ID", 400);
    }

    return errorResponse(res, "Failed to retrieve work order", 500);
  }
};

/**
 * Create new work order
 * POST /api/work-orders
 */
exports.createWorkOrder = async (req, res) => {
  try {
    const {
      deviceId,
      binId,
      priority,
      issueDescription,
      issueType,
      estimatedResolutionTime,
    } = req.body;

    // Validate required fields
    if (!deviceId || !binId || !issueDescription) {
      return errorResponse(
        res,
        "Missing required fields: deviceId, binId, issueDescription",
        400
      );
    }

    // Validate that device and bin exist
    const [device, bin] = await Promise.all([
      Device.findById(deviceId),
      SmartBin.findById(binId),
    ]);

    if (!device) {
      return errorResponse(res, "Device not found", 404);
    }

    if (!bin) {
      return errorResponse(res, "Bin not found", 404);
    }

    // Create work order
    const workOrder = await WorkOrder.create({
      deviceId,
      binId,
      priority: priority || "medium",
      issueDescription,
      issueType: issueType || "other",
      estimatedResolutionTime: estimatedResolutionTime || null,
      status: "pending",
    });

    // Populate the created work order
    await workOrder.populate([
      { path: "deviceId", select: "deviceId deviceType status" },
      { path: "binId", select: "binId location status" },
    ]);

    // Update device status to indicate issue
    if (device.status === "active") {
      device.status = "error";
      await device.save();
    }

    // Update bin status if it's a critical issue
    if (priority === "urgent" || priority === "high") {
      if (bin.status === "active") {
        bin.status = "maintenance";
        await bin.save();
      }
    }

    const workOrderData = {
      ...workOrder.toObject(),
      daysSinceCreated: workOrder.daysSinceCreated,
    };

    return successResponse(res, workOrderData, "Work order created successfully", 201);
  } catch (error) {
    console.error("Error creating work order:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    return errorResponse(res, "Failed to create work order", 500);
  }
};

/**
 * Update work order
 * PUT /api/work-orders/:id
 */
exports.updateWorkOrder = async (req, res) => {
  try {
    const updates = req.body;

    // Prevent updating certain fields directly
    delete updates.workOrderId;
    delete updates.status; // Status should be updated via specific endpoints
    delete updates.assignedDate;
    delete updates.resolvedDate;

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, "No valid fields provided for update", 400);
    }

    const workOrder = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate([
      { path: "technicianId", select: "name phone email" },
      { path: "deviceId", select: "deviceId deviceType status" },
      { path: "binId", select: "binId location status" },
    ]);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    const workOrderData = {
      ...workOrder.toObject(),
      daysSinceCreated: workOrder.daysSinceCreated,
      resolutionTime: workOrder.resolutionTime,
    };

    return successResponse(res, workOrderData, "Work order updated successfully");
  } catch (error) {
    console.error("Error updating work order:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid work order ID", 400);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return errorResponse(res, messages.join(", "), 400);
    }

    return errorResponse(res, "Failed to update work order", 500);
  }
};

/**
 * Assign work order to technician
 * PUT /api/work-orders/:id/assign
 */
exports.assignWorkOrder = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return errorResponse(res, "Technician ID is required", 400);
    }

    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    if (workOrder.status !== "pending") {
      return errorResponse(res, "Only pending work orders can be assigned", 400);
    }

    await workOrder.assignToTechnician(technicianId);

    return successResponse(res, {
      workOrderId: workOrder.workOrderId,
      technicianId: workOrder.technicianId,
      status: workOrder.status,
      assignedDate: workOrder.assignedDate,
    }, "Work order assigned successfully");
  } catch (error) {
    console.error("Error assigning work order:", error);
    return errorResponse(res, "Failed to assign work order", 500);
  }
};

/**
 * Start work on order
 * PUT /api/work-orders/:id/start
 */
exports.startWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    if (workOrder.status !== "assigned") {
      return errorResponse(res, "Only assigned work orders can be started", 400);
    }

    await workOrder.startWork();

    return successResponse(res, {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
    }, "Work order started successfully");
  } catch (error) {
    console.error("Error starting work order:", error);
    return errorResponse(res, "Failed to start work order", 500);
  }
};

/**
 * Resolve work order
 * PUT /api/work-orders/:id/resolve
 */
exports.resolveWorkOrder = async (req, res) => {
  try {
    const { actionTaken, resolutionNotes, newDeviceId } = req.body;

    if (!actionTaken || !["repaired", "replaced"].includes(actionTaken)) {
      return errorResponse(
        res,
        "Valid action taken is required (repaired/replaced)",
        400
      );
    }

    if (!resolutionNotes) {
      return errorResponse(res, "Resolution notes are required", 400);
    }

    if (actionTaken === "replaced" && !newDeviceId) {
      return errorResponse(res, "New device ID is required for replacement", 400);
    }

    const workOrder = await WorkOrder.findById(req.params.id)
      .populate("deviceId")
      .populate("binId");

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    if (!["assigned", "in-progress"].includes(workOrder.status)) {
      return errorResponse(
        res,
        "Only assigned or in-progress work orders can be resolved",
        400
      );
    }

    // Resolve the work order
    await workOrder.resolve(actionTaken, resolutionNotes, newDeviceId);

    // Update device status
    const device = workOrder.deviceId;

    if (actionTaken === "repaired") {
      device.status = "active";
      device.lastSignal = new Date();
      await device.save();

      // Update bin status
      if (workOrder.binId && workOrder.binId.status === "maintenance") {
        workOrder.binId.status = "active";
        await workOrder.binId.save();
      }
    } else if (actionTaken === "replaced") {
      device.status = "decommissioned";
      await device.save();

      // Update new device
      if (newDeviceId) {
        const newDevice = await Device.findById(newDeviceId);
        if (newDevice) {
          newDevice.status = "active";
          await newDevice.save();
        }
      }
    }

    const resolvedWorkOrder = {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
      actionTaken: workOrder.actionTaken,
      resolutionNotes: workOrder.resolutionNotes,
      resolvedDate: workOrder.resolvedDate,
      actualResolutionTime: workOrder.actualResolutionTime,
    };

    return successResponse(res, resolvedWorkOrder, "Work order resolved successfully");
  } catch (error) {
    console.error("Error resolving work order:", error);
    return errorResponse(res, "Failed to resolve work order", 500);
  }
};

/**
 * Escalate work order
 * PUT /api/work-orders/:id/escalate
 */
exports.escalateWorkOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, "Escalation reason is required", 400);
    }

    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    if (!["assigned", "in-progress"].includes(workOrder.status)) {
      return errorResponse(
        res,
        "Only assigned or in-progress work orders can be escalated",
        400
      );
    }

    await workOrder.escalate(reason);

    return successResponse(res, {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
      escalationReason: reason,
    }, "Work order escalated successfully");
  } catch (error) {
    console.error("Error escalating work order:", error);
    return errorResponse(res, "Failed to escalate work order", 500);
  }
};

/**
 * Cancel work order
 * PUT /api/work-orders/:id/cancel
 */
exports.cancelWorkOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return errorResponse(res, "Cancellation reason is required", 400);
    }

    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    if (!["pending", "assigned"].includes(workOrder.status)) {
      return errorResponse(
        res,
        "Only pending or assigned work orders can be cancelled",
        400
      );
    }

    await workOrder.cancel(reason);

    return successResponse(res, {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
      cancellationReason: reason,
    }, "Work order cancelled successfully");
  } catch (error) {
    console.error("Error cancelling work order:", error);
    return errorResponse(res, "Failed to cancel work order", 500);
  }
};

/**
 * Delete work order
 * DELETE /api/work-orders/:id
 */
exports.deleteWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findByIdAndDelete(req.params.id);

    if (!workOrder) {
      return errorResponse(res, "Work order not found", 404);
    }

    return successResponse(res, {
      id: req.params.id,
      workOrderId: workOrder.workOrderId,
    }, "Work order deleted successfully");
  } catch (error) {
    console.error("Error deleting work order:", error);

    if (error.kind === "ObjectId") {
      return errorResponse(res, "Invalid work order ID", 400);
    }

    return errorResponse(res, "Failed to delete work order", 500);
  }
};
