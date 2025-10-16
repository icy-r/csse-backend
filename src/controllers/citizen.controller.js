const WasteRequest = require('../models/WasteRequest.model');
const SmartBin = require('../models/SmartBin.model');
const { successResponse, errorResponse } = require('../utils/response');
const { calculateCost } = require('../utils/helpers');
const { buildPaginationResponse } = require('../middleware/queryBuilder');

/**
 * Create waste pickup request
 * POST /api/citizen/requests
 */
exports.createRequest = async (req, res) => {
  try {
    const { userId, wasteType, quantity, address, preferredDate, description } = req.body;
    
    // Validate required fields
    if (!userId || !wasteType || !quantity || !address || !preferredDate) {
      return errorResponse(res, 'Missing required fields', 400);
    }
    
    // Validate preferred date is in the future
    const preferred = new Date(preferredDate);
    if (preferred < new Date()) {
      return errorResponse(res, 'Preferred date must be in the future', 400);
    }
    
    // Calculate estimated cost
    const estimatedCost = calculateCost(wasteType, quantity);
    const paymentStatus = estimatedCost > 0 ? 'pending' : 'not-required';
    
    // Create request
    const request = await WasteRequest.create({
      userId,
      wasteType,
      quantity,
      address,
      preferredDate: preferred,
      description,
      estimatedCost,
      paymentStatus,
      status: 'pending'
    });
    
    return successResponse(res, 'Request created successfully', {
      trackingId: request.trackingId,
      requestId: request._id,
      status: request.status,
      estimatedCost: request.estimatedCost,
      paymentRequired: paymentStatus !== 'not-required',
      preferredDate: request.preferredDate
    }, 201);
    
  } catch (error) {
    console.error('Error creating request:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get user's requests with OData filtering
 * GET /api/citizen/requests
 */
exports.getRequests = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Add userId to query if provided (from OData middleware)
    if (userId) {
      req.dbQuery.userId = userId;
    }
    
    const { page, limit, sort, select } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    // Execute query
    const [requests, total] = await Promise.all([
      WasteRequest
        .find(req.dbQuery)
        .select(select)
        .sort(sort.createdAt ? sort : { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('routeId', 'routeName status scheduledDate'),
      WasteRequest.countDocuments(req.dbQuery)
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Requests retrieved successfully', requests, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching requests:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Track specific request
 * GET /api/citizen/requests/:id
 */
exports.trackRequest = async (req, res) => {
  try {
    const request = await WasteRequest
      .findById(req.params.id)
      .populate('routeId', 'routeName status scheduledDate crewId')
      .populate('userId', 'name email phone');
    
    if (!request) {
      return errorResponse(res, 'Request not found', 404);
    }
    
    // Build status timeline
    const timeline = [];
    
    // Request submitted
    timeline.push({
      status: 'pending',
      label: 'Request Submitted',
      date: request.createdAt,
      completed: true,
      icon: 'check'
    });
    
    // Request approved or rejected
    if (['approved', 'scheduled', 'in-progress', 'completed'].includes(request.status)) {
      timeline.push({
        status: 'approved',
        label: 'Request Approved',
        date: request.updatedAt,
        completed: true,
        icon: 'check'
      });
    } else if (request.status === 'rejected') {
      timeline.push({
        status: 'rejected',
        label: 'Request Rejected',
        date: request.updatedAt,
        completed: true,
        icon: 'close',
        notes: request.rejectionReason
      });
    }
    
    // Scheduled
    if (request.scheduledDate && ['scheduled', 'in-progress', 'completed'].includes(request.status)) {
      timeline.push({
        status: 'scheduled',
        label: 'Collection Scheduled',
        date: request.scheduledDate,
        completed: true,
        icon: 'calendar'
      });
    }
    
    // In progress
    if (['in-progress', 'completed'].includes(request.status)) {
      timeline.push({
        status: 'in-progress',
        label: 'Collection In Progress',
        date: request.updatedAt,
        completed: request.status === 'completed',
        icon: request.status === 'completed' ? 'check' : 'progress',
        current: request.status === 'in-progress'
      });
    }
    
    // Completed
    if (request.completedDate) {
      timeline.push({
        status: 'completed',
        label: 'Collection Completed',
        date: request.completedDate,
        completed: true,
        icon: 'check-circle'
      });
    }
    
    const response = {
      ...request.toObject(),
      timeline
    };
    
    return successResponse(res, 'Request details retrieved', response);
    
  } catch (error) {
    console.error('Error tracking request:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update payment status
 * PUT /api/citizen/requests/:id/payment
 */
exports.updatePayment = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount) {
      return errorResponse(res, 'Payment amount is required', 400);
    }
    
    const request = await WasteRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Request not found', 404);
    }
    
    if (request.paymentStatus === 'paid') {
      return errorResponse(res, 'Payment already completed', 400);
    }
    
    if (request.paymentStatus === 'not-required') {
      return errorResponse(res, 'Payment not required for this request', 400);
    }
    
    request.actualCost = amount;
    request.paymentStatus = 'paid';
    await request.save();
    
    return successResponse(res, 'Payment recorded successfully', {
      trackingId: request.trackingId,
      paymentStatus: request.paymentStatus,
      amount: request.actualCost,
      paymentMethod
    });
    
  } catch (error) {
    console.error('Error updating payment:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Find nearby bins
 * POST /api/citizen/bins/nearby
 */
exports.getNearbyBins = async (req, res) => {
  try {
    const { lat, lng, radius = 2000, binType } = req.body;
    
    if (!lat || !lng) {
      return errorResponse(res, 'Latitude and longitude required', 400);
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const maxDistance = parseInt(radius);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return errorResponse(res, 'Invalid coordinates', 400);
    }
    
    // Build query
    const query = {
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistance
        }
      },
      status: 'active'
    };
    
    // Add bin type filter if provided
    if (binType) {
      query.binType = binType;
    }
    
    const bins = await SmartBin.find(query).limit(20);
    
    // Add distance and status info
    const binsWithMetadata = bins.map(bin => ({
      ...bin.toObject(),
      fillStatusColor: bin.fillStatusColor,
      fillStatusLabel: bin.fillStatusLabel,
      needsCollection: bin.needsCollection
    }));
    
    return successResponse(res, 'Nearby bins retrieved', binsWithMetadata);
    
  } catch (error) {
    console.error('Error fetching nearby bins:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Cancel request
 * PUT /api/citizen/requests/:id/cancel
 */
exports.cancelRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await WasteRequest.findById(req.params.id);
    
    if (!request) {
      return errorResponse(res, 'Request not found', 404);
    }
    
    // Can only cancel pending or approved requests
    if (!['pending', 'approved'].includes(request.status)) {
      return errorResponse(res, `Cannot cancel request with status: ${request.status}`, 400);
    }
    
    request.status = 'cancelled';
    request.notes = reason || 'Cancelled by user';
    await request.save();
    
    return successResponse(res, 'Request cancelled successfully', {
      trackingId: request.trackingId,
      status: request.status
    });
    
  } catch (error) {
    console.error('Error cancelling request:', error);
    return errorResponse(res, error.message, 500);
  }
};

