const WorkOrder = require('../models/WorkOrder.model');
const Device = require('../models/Device.model');
const SmartBin = require('../models/SmartBin.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');

/**
 * Get work orders
 * GET /api/technician/work-orders
 */
exports.getWorkOrders = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    // Default sort: priority desc, created asc
    const sortOrder = Object.keys(sort).length > 0 
      ? sort 
      : { priority: -1, createdAt: 1 };
    
    // Convert priority text to sort order
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    const [workOrders, total] = await Promise.all([
      WorkOrder
        .find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('technicianId', 'name phone email')
        .populate('deviceId', 'deviceId deviceType status')
        .populate('binId', 'binId location'),
      WorkOrder.countDocuments(req.dbQuery)
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Work orders retrieved successfully', workOrders, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get work order details
 * GET /api/technician/work-orders/:id
 */
exports.getWorkOrderDetails = async (req, res) => {
  try {
    const workOrder = await WorkOrder
      .findById(req.params.id)
      .populate('technicianId', 'name phone email')
      .populate({
        path: 'deviceId',
        select: 'deviceId deviceType status batteryLevel errorLog maintenanceHistory',
        populate: {
          path: 'maintenanceHistory.technicianId',
          select: 'name'
        }
      })
      .populate('binId', 'binId location fillLevel status')
      .populate('newDeviceId', 'deviceId deviceType status');
    
    if (!workOrder) {
      return errorResponse(res, 'Work order not found', 404);
    }
    
    return successResponse(res, 'Work order details retrieved', workOrder);
    
  } catch (error) {
    console.error('Error fetching work order details:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Assign work order to technician (self-assign or coordinator assign)
 * PUT /api/technician/work-orders/:id/assign
 */
exports.assignWorkOrder = async (req, res) => {
  try {
    const { technicianId } = req.body;
    
    if (!technicianId) {
      return errorResponse(res, 'Technician ID is required', 400);
    }
    
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return errorResponse(res, 'Work order not found', 404);
    }
    
    if (workOrder.status !== 'pending') {
      return errorResponse(res, 'Only pending work orders can be assigned', 400);
    }
    
    await workOrder.assignToTechnician(technicianId);
    
    return successResponse(res, 'Work order assigned successfully', {
      workOrderId: workOrder.workOrderId,
      technicianId: workOrder.technicianId,
      status: workOrder.status,
      assignedDate: workOrder.assignedDate
    });
    
  } catch (error) {
    console.error('Error assigning work order:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Start work on order
 * PUT /api/technician/work-orders/:id/start
 */
exports.startWorkOrder = async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return errorResponse(res, 'Work order not found', 404);
    }
    
    if (workOrder.status !== 'assigned') {
      return errorResponse(res, 'Only assigned work orders can be started', 400);
    }
    
    await workOrder.startWork();
    
    return successResponse(res, 'Work order started', {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status
    });
    
  } catch (error) {
    console.error('Error starting work order:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Resolve work order
 * PUT /api/technician/work-orders/:id/resolve
 */
exports.resolveWorkOrder = async (req, res) => {
  try {
    const { actionTaken, resolutionNotes, newDeviceId } = req.body;
    
    if (!actionTaken || !['repaired', 'replaced'].includes(actionTaken)) {
      return errorResponse(res, 'Valid action taken is required (repaired/replaced)', 400);
    }
    
    if (!resolutionNotes) {
      return errorResponse(res, 'Resolution notes are required', 400);
    }
    
    if (actionTaken === 'replaced' && !newDeviceId) {
      return errorResponse(res, 'New device ID is required for replacement', 400);
    }
    
    const workOrder = await WorkOrder.findById(req.params.id)
      .populate('deviceId')
      .populate('binId');
    
    if (!workOrder) {
      return errorResponse(res, 'Work order not found', 404);
    }
    
    if (!['assigned', 'in-progress'].includes(workOrder.status)) {
      return errorResponse(res, 'Only assigned or in-progress work orders can be resolved', 400);
    }
    
    // Resolve the work order
    await workOrder.resolve(actionTaken, resolutionNotes, newDeviceId);
    
    // Update device status
    const device = workOrder.deviceId;
    
    if (actionTaken === 'repaired') {
      // Reactivate the device
      device.status = 'active';
      device.lastSignal = new Date();
      
      // Add maintenance record
      await device.addMaintenance(
        'repaired',
        workOrder.technicianId,
        resolutionNotes,
        workOrder._id
      );
      
      await device.save();
      
      // Update bin status if applicable
      if (workOrder.binId) {
        const bin = workOrder.binId;
        if (bin.status === 'maintenance' || bin.status === 'offline') {
          bin.status = 'active';
          await bin.save();
        }
      }
    } else if (actionTaken === 'replaced') {
      // Decommission old device
      await device.decommission();
      
      // Add final maintenance record
      await device.addMaintenance(
        'replaced',
        workOrder.technicianId,
        `Replaced with device: ${newDeviceId}`,
        workOrder._id
      );
      
      // Activate new device
      const newDevice = await Device.findById(newDeviceId);
      if (newDevice) {
        newDevice.status = 'active';
        newDevice.binId = workOrder.binId?._id;
        newDevice.lastSignal = new Date();
        await newDevice.save();
        
        // Update bin with new device
        if (workOrder.binId) {
          const bin = await SmartBin.findById(workOrder.binId._id);
          if (bin) {
            bin.deviceId = newDeviceId;
            if (bin.status === 'maintenance' || bin.status === 'offline') {
              bin.status = 'active';
            }
            await bin.save();
          }
        }
      }
    }
    
    return successResponse(res, 'Work order resolved successfully', {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
      actionTaken: workOrder.actionTaken,
      resolutionTime: workOrder.actualResolutionTime
    });
    
  } catch (error) {
    console.error('Error resolving work order:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Register/scan new device
 * POST /api/technician/devices/register
 */
exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, deviceType, binId } = req.body;
    
    if (!deviceId || !deviceType) {
      return errorResponse(res, 'Device ID and type are required', 400);
    }
    
    // Check if device already exists
    const existing = await Device.findOne({ deviceId });
    if (existing) {
      return errorResponse(res, 'Device ID already registered', 400);
    }
    
    const device = await Device.create({
      deviceId,
      deviceType,
      binId: binId || null,
      status: 'active',
      installationDate: new Date(),
      lastSignal: new Date()
    });
    
    return successResponse(res, 'Device registered successfully', device, 201);
    
  } catch (error) {
    console.error('Error registering device:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Escalate work order
 * PUT /api/technician/work-orders/:id/escalate
 */
exports.escalateWorkOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return errorResponse(res, 'Escalation reason is required', 400);
    }
    
    const workOrder = await WorkOrder.findById(req.params.id);
    
    if (!workOrder) {
      return errorResponse(res, 'Work order not found', 404);
    }
    
    if (!['assigned', 'in-progress'].includes(workOrder.status)) {
      return errorResponse(res, 'Only assigned or in-progress work orders can be escalated', 400);
    }
    
    await workOrder.escalate(reason);
    
    return successResponse(res, 'Work order escalated', {
      workOrderId: workOrder.workOrderId,
      status: workOrder.status,
      reason: workOrder.resolutionNotes
    });
    
  } catch (error) {
    console.error('Error escalating work order:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get device details
 * GET /api/technician/devices/:id
 */
exports.getDeviceDetails = async (req, res) => {
  try {
    const device = await Device
      .findById(req.params.id)
      .populate('binId', 'binId location fillLevel status')
      .populate('maintenanceHistory.technicianId', 'name');
    
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }
    
    // Get work orders for this device
    const workOrders = await WorkOrder
      .find({ deviceId: device._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('workOrderId status priority issueDescription createdAt resolvedDate');
    
    const response = {
      ...device.toObject(),
      recentWorkOrders: workOrders,
      batteryStatus: device.batteryStatus,
      isOnline: device.isOnline,
      daysSinceLastSignal: device.daysSinceLastSignal
    };
    
    return successResponse(res, 'Device details retrieved', response);
    
  } catch (error) {
    console.error('Error fetching device details:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update device status (for testing/debugging)
 * PUT /api/technician/devices/:id/status
 */
exports.updateDeviceStatus = async (req, res) => {
  try {
    const { status, batteryLevel } = req.body;
    
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }
    
    if (status) {
      const validStatuses = ['active', 'offline', 'decommissioned'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }
      device.status = status;
    }
    
    if (batteryLevel !== undefined) {
      device.batteryLevel = Math.max(0, Math.min(100, batteryLevel));
    }
    
    device.lastSignal = new Date();
    await device.save();
    
    return successResponse(res, 'Device status updated', {
      deviceId: device.deviceId,
      status: device.status,
      batteryLevel: device.batteryLevel
    });
    
  } catch (error) {
    console.error('Error updating device status:', error);
    return errorResponse(res, error.message, 500);
  }
};

