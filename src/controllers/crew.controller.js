const Route = require('../models/Route.model');
const User = require('../models/User.model');
const CrewProfile = require('../models/CrewProfile.model');
const SmartBin = require('../models/SmartBin.model');
const WasteRequest = require('../models/WasteRequest.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');

/**
 * Get crew dashboard with statistics and current assignments
 * GET /api/crew/dashboard
 */
exports.getCrewDashboard = async (req, res) => {
  try {
    const { crewId } = req.query;
    
    if (!crewId) {
      return errorResponse(res, 'Crew ID is required', 400);
    }
    
    // Get crew user details
    const crew = await User.findById(crewId).select('-password');
    if (!crew || crew.role !== 'crew') {
      return errorResponse(res, 'Crew member not found', 404);
    }
    
    // Get crew profile
    let profile = await CrewProfile.findOne({ userId: crewId });
    if (!profile) {
      profile = await CrewProfile.create({ userId: crewId });
    }
    
    // Get route statistics
    const [totalRoutes, completedRoutes, activeRoute, pendingRoutes] = await Promise.all([
      Route.countDocuments({ crewId }),
      Route.countDocuments({ crewId, status: 'completed' }),
      Route.findOne({ crewId, status: { $in: ['assigned', 'in-progress'] } })
        .populate('coordinatorId', 'name phone')
        .select('routeName status scheduledDate startTime stops'),
      Route.countDocuments({ crewId, status: { $in: ['assigned', 'pending'] } })
    ]);
    
    // Calculate completion rate
    const completionRate = totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0;
    
    // Get recent activity (last 5 routes)
    const recentRoutes = await Route
      .find({ crewId })
      .sort({ scheduledDate: -1 })
      .limit(5)
      .select('routeName status scheduledDate completionPercentage');
    
    const dashboardData = {
      crew: {
        id: crew._id,
        name: crew.name,
        email: crew.email,
        phone: crew.phone
      },
      profile: {
        vehicleId: profile.vehicleId,
        availability: profile.availability,
        lastUpdated: profile.lastUpdated
      },
      statistics: {
        totalRoutes,
        completedRoutes,
        pendingRoutes,
        completionRate
      },
      activeRoute: activeRoute ? {
        id: activeRoute._id,
        name: activeRoute.routeName,
        status: activeRoute.status,
        scheduledDate: activeRoute.scheduledDate,
        startTime: activeRoute.startTime,
        totalStops: activeRoute.stops.length,
        completedStops: activeRoute.stops.filter(s => s.status === 'completed').length,
        coordinator: activeRoute.coordinatorId
      } : null,
      recentActivity: recentRoutes
    };
    
    return successResponse(res, 'Dashboard data retrieved successfully', dashboardData);
    
  } catch (error) {
    console.error('Error fetching crew dashboard:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get crew's active route
 * GET /api/crew/routes/active
 */
exports.getActiveRoute = async (req, res) => {
  try {
    const { crewId } = req.query;
    
    if (!crewId) {
      return errorResponse(res, 'Crew ID is required', 400);
    }
    
    const activeRoute = await Route.findOne({ 
      crewId, 
      status: { $in: ['assigned', 'in-progress'] } 
    })
    .populate('coordinatorId', 'name phone email')
    .select('routeName status scheduledDate startTime endTime stops notes vehicleId');
    
    if (!activeRoute) {
      return successResponse(res, 'No active route found', null);
    }
    
    // Format route with stop details
    const formattedRoute = {
      ...activeRoute.toObject(),
      totalStops: activeRoute.stops.length,
      completedStops: activeRoute.stops.filter(s => s.status === 'completed').length,
      pendingStops: activeRoute.stops.filter(s => s.status === 'pending').length,
      completionPercentage: activeRoute.stops.length > 0 
        ? Math.round((activeRoute.stops.filter(s => s.status === 'completed').length / activeRoute.stops.length) * 100)
        : 0
    };
    
    return successResponse(res, 'Active route retrieved successfully', formattedRoute);
    
  } catch (error) {
    console.error('Error fetching active route:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get crew's assigned routes
 * GET /api/crew/routes
 */
exports.getMyRoutes = async (req, res) => {
  try {
    const { crewId } = req.query;
    
    if (!crewId) {
      return errorResponse(res, 'Crew ID is required', 400);
    }
    
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {
      crewId: crewId,
      ...req.dbQuery
    };
    
    // Default sort by scheduledDate descending
    const sortOrder = Object.keys(sort).length > 0 ? sort : { scheduledDate: -1 };
    
    const [routes, total] = await Promise.all([
      Route
        .find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('coordinatorId', 'name email phone')
        .select('routeName status scheduledDate startTime endTime totalDistance estimatedDuration completionPercentage stops'),
      Route.countDocuments(query)
    ]);
    
    // Format routes with stop counts
    const formattedRoutes = routes.map(route => ({
      ...route.toObject(),
      totalStops: route.stops.length,
      completedStops: route.stops.filter(s => s.status === 'completed').length,
      pendingStops: route.stops.filter(s => s.status === 'pending').length
    }));
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Routes retrieved successfully', formattedRoutes, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching crew routes:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get route details
 * GET /api/crew/routes/:id
 */
exports.getRouteDetails = async (req, res) => {
  try {
    const route = await Route
      .findById(req.params.id)
      .populate('coordinatorId', 'name email phone')
      .populate('crewId', 'name phone');
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    // Populate stops with bin/request details
    const populatedStops = await Promise.all(
      route.stops.map(async (stop) => {
        if (stop.stopType === 'bin') {
          const bin = await SmartBin.findById(stop.referenceId)
            .select('binId location fillLevel capacity binType status');
          return {
            ...stop.toObject(),
            details: bin
          };
        } else if (stop.stopType === 'request') {
          const request = await WasteRequest.findById(stop.referenceId)
            .select('trackingId wasteType quantity address userId')
            .populate('userId', 'name phone');
          return {
            ...stop.toObject(),
            details: request
          };
        }
        return stop.toObject();
      })
    );
    
    const routeData = {
      ...route.toObject(),
      stops: populatedStops
    };
    
    return successResponse(res, 'Route details retrieved', routeData);
    
  } catch (error) {
    console.error('Error fetching route details:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update stop status in route
 * PUT /api/crew/routes/:routeId/stops/:stopIndex
 */
exports.updateStopStatus = async (req, res) => {
  try {
    const { routeId, stopIndex } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return errorResponse(res, "Status is required", 400);
    }

    if (!["pending", "completed", "skipped"].includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Must be: pending, completed, or skipped",
        400
      );
    }

    if (status === "skipped" && !notes) {
      return errorResponse(res, "Notes are required when skipping a stop", 400);
    }

    const route = await Route.findById(routeId);

    if (!route) {
      return errorResponse(res, "Route not found", 404);
    }

    const stopIdx = parseInt(stopIndex);

    if (isNaN(stopIdx) || stopIdx < 0 || stopIdx >= route.stops.length) {
      return errorResponse(res, "Invalid stop index", 400);
    }

    // Update stop status
    route.stops[stopIdx].status = status;
    if (notes) {
      route.stops[stopIdx].notes = notes;
    }
    if (status === "completed") {
      route.stops[stopIdx].completedAt = new Date();
    }

    // Recalculate completion percentage
    const completedStops = route.stops.filter(
      (s) => s.status === "completed"
    ).length;
    route.completionPercentage = Math.round(
      (completedStops / route.stops.length) * 100
    );

    // Update route status based on completion
    if (route.completionPercentage === 100) {
      route.status = "completed";
      route.endTime = new Date();

      // Update crew profile
      const crewProfile = await CrewProfile.findOne({ userId: route.crewId });
      if (crewProfile) {
        await crewProfile.completeRoute();
      }
    } else if (route.status === "assigned" && completedStops > 0) {
      route.status = "in-progress";
      route.startTime = route.startTime || new Date();
    }

    await route.save();

    // If it's a waste request, update its status
    const stop = route.stops[stopIdx];
    if (stop.stopType === "request" && status === "completed") {
      await WasteRequest.findByIdAndUpdate(stop.referenceId, {
        status: "completed",
        completedDate: new Date(),
      });
    }

    // If it's a bin and completed, empty the bin
    if (status === "completed" && stop.stopType === "bin") {
      const bin = await SmartBin.findById(stop.referenceId);
      if (bin) {
        await bin.empty();
      }
    }

    return successResponse(res, "Stop status updated successfully", {
      routeId: route._id,
      stopIndex: stopIdx,
      status: stop.status,
      completionPercentage: route.completionPercentage,
      routeStatus: route.status,
    });
  } catch (error) {
    console.error('Error updating stop status:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Report issue during collection
 * POST /api/crew/issues
 */
exports.reportIssue = async (req, res) => {
  try {
    const { crewId, routeId, issueType, description, location, stopIndex } = req.body;
    
    if (!crewId || !issueType || !description) {
      return errorResponse(res, 'Crew ID, issue type, and description are required', 400);
    }
    
    // For now, we'll store issues as notes in the route
    // In a full implementation, you might want a separate Issues model
    const route = await Route.findById(routeId);
    
    if (!route) {
      return errorResponse(res, 'Route not found', 404);
    }
    
    // Add issue to route notes
    const issueNote = `[ISSUE REPORTED] ${new Date().toISOString()}\nType: ${issueType}\nDescription: ${description}\nLocation: ${location || 'Not specified'}`;
    route.notes = route.notes ? `${route.notes}\n\n${issueNote}` : issueNote;
    
    // If stopIndex is provided, add note to that stop as well
    if (stopIndex !== undefined && route.stops[stopIndex]) {
      route.stops[stopIndex].notes = route.stops[stopIndex].notes 
        ? `${route.stops[stopIndex].notes}\n${issueNote}` 
        : issueNote;
    }
    
    await route.save();
    
    return successResponse(res, 'Issue reported successfully', {
      routeId: route._id,
      issueType,
      timestamp: new Date()
    }, 201);
    
  } catch (error) {
    console.error('Error reporting issue:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get crew profile
 * GET /api/crew/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const { crewId } = req.query;
    
    if (!crewId) {
      return errorResponse(res, 'Crew ID is required', 400);
    }
    
    const user = await User.findById(crewId).select('-password');
    
    if (!user) {
      return errorResponse(res, 'Crew member not found', 404);
    }
    
    if (user.role !== 'crew') {
      return errorResponse(res, 'User is not a crew member', 400);
    }
    
    // Get crew profile if exists
    let crewProfile = await CrewProfile.findOne({ userId: crewId });
    
    // If no profile exists, create one
    if (!crewProfile) {
      crewProfile = await CrewProfile.create({ userId: crewId });
    }
    
    // Get current route details if assigned
    let currentRoute = null;
    if (crewProfile.currentRouteId) {
      currentRoute = await Route.findById(crewProfile.currentRouteId)
        .select('routeName status scheduledDate completionPercentage');
    }
    
    const profileData = {
      user: user,
      profile: crewProfile,
      currentRoute: currentRoute
    };
    
    return successResponse(res, 'Profile retrieved successfully', profileData);
    
  } catch (error) {
    console.error('Error fetching crew profile:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update crew availability
 * PUT /api/crew/profile/:crewId/availability
 */
exports.updateCrewAvailability = async (req, res) => {
  try {
    const { crewId } = req.params;
    const { availability } = req.body;
    
    if (!crewId || !availability) {
      return errorResponse(res, 'Crew ID and availability are required', 400);
    }
    
    const validStatuses = ['available', 'unavailable', 'on-leave'];
    if (!validStatuses.includes(availability)) {
      return errorResponse(res, `Invalid availability. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    // Get crew user
    const crew = await User.findById(crewId);
    if (!crew || crew.role !== 'crew') {
      return errorResponse(res, 'Crew member not found', 404);
    }
    
    // Get or create crew profile
    let profile = await CrewProfile.findOne({ userId: crewId });
    if (!profile) {
      profile = await CrewProfile.create({ userId: crewId });
    }
    
    // Update availability
    await profile.updateAvailability(availability);
    
    return successResponse(res, 'Availability updated successfully', {
      crewId: crew._id,
      crewName: crew.name,
      availability: profile.availability,
      lastUpdated: profile.lastUpdated
    });
    
  } catch (error) {
    console.error('Error updating crew availability:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;

