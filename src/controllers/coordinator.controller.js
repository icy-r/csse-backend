const WasteRequest = require('../models/WasteRequest.model');
const SmartBin = require('../models/SmartBin.model');
const Route = require('../models/Route.model');
const WorkOrder = require('../models/WorkOrder.model');
const Device = require('../models/Device.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');
const { optimizeRoute } = require('../services/routeOptimizer.service');

/**
 * Get coordinator dashboard
 * GET /api/coordinator/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get bin statistics
    const [totalBins, fullBins, fillingBins] = await Promise.all([
      SmartBin.countDocuments({ status: 'active' }),
      SmartBin.countDocuments({ status: 'active', fillLevel: { $gte: 90 } }),
      SmartBin.countDocuments({ status: 'active', fillLevel: { $gte: 70, $lt: 90 } })
    ]);
    
    // Get request statistics
    const [pendingRequests, approvedRequests] = await Promise.all([
      WasteRequest.countDocuments({ status: 'pending' }),
      WasteRequest.countDocuments({ status: 'approved' })
    ]);
    
    // Get active routes
    const activeRoutes = await Route.countDocuments({ 
      status: { $in: ['assigned', 'in-progress'] } 
    });
    
    // Get recent pending requests (last 10)
    const recentRequests = await WasteRequest
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name phone')
      .select('trackingId wasteType quantity address preferredDate createdAt');
    
    const dashboard = {
      bins: {
        total: totalBins,
        full: fullBins,
        filling: fillingBins,
        available: totalBins - fullBins - fillingBins
      },
      requests: {
        pending: pendingRequests,
        approved: approvedRequests,
        total: pendingRequests + approvedRequests
      },
      routes: {
        active: activeRoutes
      },
      recentRequests,
      lastUpdated: new Date()
    };
    
    return successResponse(res, 'Dashboard data retrieved', dashboard);
    
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get bins with fill levels
 * GET /api/coordinator/bins
 */
exports.getBins = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    // Default sort by fill level descending if not specified
    const sortOrder = Object.keys(sort).length > 0 ? sort : { fillLevel: -1 };
    
    const [bins, total] = await Promise.all([
      SmartBin
        .find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('deviceId', 'deviceId status batteryLevel'),
      SmartBin.countDocuments(req.dbQuery)
    ]);
    
    // Add color coding and status
    const binsWithStatus = bins.map(bin => ({
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection,
      isUrgent: bin.isUrgent
    }));
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Bins retrieved successfully', binsWithStatus, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching bins:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get pending special requests
 * GET /api/coordinator/requests/pending
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const { page, limit } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      WasteRequest
        .find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email phone address'),
      WasteRequest.countDocuments({ status: 'pending' })
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Pending requests retrieved', requests, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Approve waste request
 * PUT /api/coordinator/requests/:id/approve
 */
exports.approveRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Request not found', 404);
    }
    
    if (request.status !== 'pending') {
      return errorResponse(res, 'Only pending requests can be approved', 400);
    }
    
    await request.approve();
    
    return successResponse(res, 'Request approved successfully', {
      trackingId: request.trackingId,
      status: request.status
    });
    
  } catch (error) {
    console.error('Error approving request:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Reject waste request
 * PUT /api/coordinator/requests/:id/reject
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }
    
    const request = await WasteRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Request not found', 404);
    }
    
    if (request.status !== 'pending') {
      return errorResponse(res, 'Only pending requests can be rejected', 400);
    }
    
    await request.reject(reason);
    
    return successResponse(res, 'Request rejected', {
      trackingId: request.trackingId,
      status: request.status,
      reason: request.rejectionReason
    });
    
  } catch (error) {
    console.error('Error rejecting request:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Optimize and generate route
 * POST /api/coordinator/routes/optimize
 */
exports.optimizeRouteHandler = async (req, res) => {
  try {
    const { 
      fillLevelThreshold = 90, 
      includePendingRequests = true,
      includeApprovedRequests = true,
      startLocation,
      maxStops = 50
    } = req.body;
    
    // Get bins above threshold
    const bins = await SmartBin.find({
      status: 'active',
      fillLevel: { $gte: fillLevelThreshold }
    }).select('binId location fillLevel binType status');
    
    // Get approved requests
    let requests = [];
    if (includeApprovedRequests) {
      requests = await WasteRequest.find({
        status: 'approved'
      }).select('trackingId wasteType address');
    }
    
    // Optimize route
    const optimized = optimizeRoute(bins, requests, {
      fillLevelThreshold,
      startLocation: startLocation || { lat: 6.9271, lng: 79.8612 },
      maxStops
    });
    
    return successResponse(res, 'Route optimized successfully', optimized);
    
  } catch (error) {
    console.error('Error optimizing route:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create route from optimized data
 * POST /api/coordinator/routes
 */
exports.createRoute = async (req, res) => {
  try {
    const { 
      routeName, 
      coordinatorId, 
      stops, 
      scheduledDate,
      totalDistance,
      estimatedDuration
    } = req.body;
    
    if (!routeName || !coordinatorId || !stops || stops.length === 0) {
      return errorResponse(res, 'Missing required fields', 400);
    }
    
    const route = await Route.create({
      routeName,
      coordinatorId,
      stops,
      scheduledDate: scheduledDate || new Date(),
      totalDistance,
      estimatedDuration,
      status: 'draft'
    });
    
    return successResponse(res, 'Route created successfully', route, 201);
    
  } catch (error) {
    console.error('Error creating route:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Assign route to crew
 * PUT /api/coordinator/routes/:id/assign
 */
exports.assignRoute = async (req, res) => {
  try {
    const { crewId, vehicleId } = req.body;
    
    if (!crewId) {
      return errorResponse(res, 'Crew ID is required', 400);
    }
    
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    await route.assignToCrew(crewId, vehicleId);
    
    // Update waste requests to scheduled status
    const requestStops = route.stops.filter(s => s.stopType === 'request');
    if (requestStops.length > 0) {
      await WasteRequest.updateMany(
        { _id: { $in: requestStops.map(s => s.referenceId) } },
        { 
          status: 'scheduled', 
          scheduledDate: route.scheduledDate,
          routeId: route._id
        }
      );
    }
    
    return successResponse(res, 'Route assigned successfully', {
      routeId: route._id,
      routeName: route.routeName,
      crewId: route.crewId,
      vehicleId: route.vehicleId,
      status: route.status
    });
    
  } catch (error) {
    console.error('Error assigning route:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get routes with filtering
 * GET /api/coordinator/routes
 */
exports.getRoutes = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    const sortOrder = Object.keys(sort).length > 0 ? sort : { createdAt: -1 };
    
    const [routes, total] = await Promise.all([
      Route
        .find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('coordinatorId', 'name email')
        .populate('crewId', 'name phone'),
      Route.countDocuments(req.dbQuery)
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Routes retrieved successfully', routes, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching routes:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get single route details
 * GET /api/coordinator/routes/:id
 */
exports.getRouteDetails = async (req, res) => {
  try {
    const route = await Route
      .findById(req.params.id)
      .populate('coordinatorId', 'name email phone')
      .populate('crewId', 'name email phone');
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    return successResponse(res, 'Route details retrieved', route);
    
  } catch (error) {
    console.error('Error fetching route details:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update route status
 * PUT /api/coordinator/routes/:id/status
 */
exports.updateRouteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['draft', 'assigned', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }
    
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    route.status = status;
    
    if (status === 'in-progress' && !route.startTime) {
      route.startTime = new Date();
    }
    
    if (status === 'completed' && !route.endTime) {
      route.endTime = new Date();
      route.completionPercentage = 100;
    }
    
    await route.save();
    
    return successResponse(res, 'Route status updated', {
      routeId: route._id,
      status: route.status
    });
    
  } catch (error) {
    console.error('Error updating route status:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update stop status
 * PUT /api/coordinator/routes/:id/stops/:stopIndex
 */
exports.updateStopStatus = async (req, res) => {
  try {
    const { stopIndex } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }
    
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    const index = parseInt(stopIndex);
    if (index < 0 || index >= route.stops.length) {
      return errorResponse(res, 'Invalid stop index', 400);
    }
    
    route.updateStopStatus(index, status);
    await route.save();
    
    // If stop is a bin and completed, empty the bin
    if (status === 'completed' && route.stops[index].stopType === 'bin') {
      const bin = await SmartBin.findById(route.stops[index].referenceId);
      if (bin) {
        await bin.empty();
      }
    }
    
    // If stop is a request and completed, update request status
    if (status === 'completed' && route.stops[index].stopType === 'request') {
      const request = await WasteRequest.findById(route.stops[index].referenceId);
      if (request) {
        await request.complete();
      }
    }
    
    return successResponse(res, 'Stop status updated', {
      routeId: route._id,
      stopIndex: index,
      stopStatus: status,
      routeCompletion: route.completionPercentage
    });
    
  } catch (error) {
    console.error('Error updating stop status:', error);
    return errorResponse(res, error.message, 500);
  }
};

// added

/**
 * Create work order for device/bin maintenance
 * POST /api/coordinator/work-orders
 */
exports.createWorkOrder = async (req, res) => {
  try {
    const { deviceId, binId, issueDescription, issueType, priority } = req.body;
    
    if (!deviceId || !binId || !issueDescription) {
      return errorResponse(res, 'Device ID, Bin ID, and issue description are required', 400);
    }
    
    // Verify device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return errorResponse(res, 'Device not found', 404);
    }
    
    // Verify bin exists
    const bin = await SmartBin.findById(binId);
    if (!bin) {
      return errorResponse(res, 'Bin not found', 404);
    }
    
    // Create work order
    const workOrder = await WorkOrder.create({
      deviceId,
      binId,
      issueDescription,
      issueType: issueType || 'other',
      priority: priority || 'medium',
      status: 'pending'
    });
    
    return successResponse(res, 'Work order created successfully', workOrder, 201);
    
  } catch (error) {
    console.error('Error creating work order:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create a new smart bin
 * POST /api/coordinator/bins
 */
exports.createBin = async (req, res) => {
  try {
    const { binId, location, capacity, binType } = req.body;
    
    if (!binId || !location || !location.coordinates) {
      return errorResponse(res, 'Bin ID and location with coordinates are required', 400);
    }
    
    if (!location.coordinates.lat || !location.coordinates.lng) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }
    
    // Check if bin already exists
    const existing = await SmartBin.findOne({ binId });
    if (existing) {
      return errorResponse(res, 'Bin ID already exists', 400);
    }
    
    const bin = await SmartBin.create({
      binId,
      location,
      capacity: capacity || 240,
      binType: binType || 'general',
      fillLevel: 0,
      status: 'active',
      lastUpdated: new Date()
    });
    
    return successResponse(res, 'Bin created successfully', bin, 201);
    
  } catch (error) {
    console.error('Error creating bin:', error);
    return errorResponse(res, error.message, 500);
  }
};