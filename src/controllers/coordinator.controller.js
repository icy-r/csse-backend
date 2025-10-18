const WasteRequest = require('../models/WasteRequest.model');
const SmartBin = require('../models/SmartBin.model');
const Route = require('../models/Route.model');
const User = require("../models/User.model");
const CrewProfile = require("../models/CrewProfile.model");
const { successResponse, errorResponse } = require("../utils/response");
const { buildPaginationResponse } = require("../middleware/queryBuilder");
const { optimizeRoute } = require("../services/routeOptimizer.service");

/**
 * Get coordinator dashboard
 * GET /api/coordinator/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    // Get bin statistics
    const [totalBins, fullBins, fillingBins] = await Promise.all([
      SmartBin.countDocuments({ status: "active" }),
      SmartBin.countDocuments({ status: "active", fillLevel: { $gte: 90 } }),
      SmartBin.countDocuments({
        status: "active",
        fillLevel: { $gte: 70, $lt: 90 },
      }),
    ]);

    // Get request statistics
    const [pendingRequests, approvedRequests] = await Promise.all([
      WasteRequest.countDocuments({ status: "pending" }),
      WasteRequest.countDocuments({ status: "approved" }),
    ]);

    // Get active routes
    const activeRoutes = await Route.countDocuments({
      status: { $in: ["assigned", "in-progress"] },
    });

    // Get recent pending requests (last 10)
    const recentRequests = await WasteRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name phone")
      .select("trackingId wasteType quantity address preferredDate createdAt");

    const dashboard = {
      bins: {
        total: totalBins,
        full: fullBins,
        filling: fillingBins,
        available: totalBins - fullBins - fillingBins,
      },
      requests: {
        pending: pendingRequests,
        approved: approvedRequests,
        total: pendingRequests + approvedRequests,
      },
      routes: {
        active: activeRoutes,
      },
      recentRequests,
      lastUpdated: new Date(),
    };

    return successResponse(res, "Dashboard data retrieved", dashboard);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
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
      SmartBin.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate("deviceId", "deviceId status batteryLevel"),
      SmartBin.countDocuments(req.dbQuery),
    ]);

    // Add color coding and status
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
      "Bins retrieved successfully",
      binsWithStatus,
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching bins:", error);
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
      WasteRequest.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email phone address"),
      WasteRequest.countDocuments({ status: "pending" }),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      "Pending requests retrieved",
      requests,
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching pending requests:", error);
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
      return errorResponse(res, "Request not found", 404);
    }

    if (request.status !== "pending") {
      return errorResponse(res, "Only pending requests can be approved", 400);
    }

    await request.approve();

    return successResponse(res, "Request approved successfully", {
      trackingId: request.trackingId,
      status: request.status,
    });
  } catch (error) {
    console.error("Error approving request:", error);
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
      return errorResponse(res, "Rejection reason is required", 400);
    }

    const request = await WasteRequest.findById(req.params.id);

    if (!request) {
      return errorResponse(res, "Request not found", 404);
    }

    if (request.status !== "pending") {
      return errorResponse(res, "Only pending requests can be rejected", 400);
    }

    await request.reject(reason);

    return successResponse(res, "Request rejected", {
      trackingId: request.trackingId,
      status: request.status,
      reason: request.rejectionReason,
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
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
      maxStops = 50,
      coordinatorId,
      routeName,
    } = req.body;

    // Get bins above threshold
    const bins = await SmartBin.find({
      status: "active",
      fillLevel: { $gte: fillLevelThreshold },
    }).select("binId location fillLevel binType status");

    // Get approved requests
    let requests = [];
    if (includeApprovedRequests) {
      requests = await WasteRequest.find({
        status: "approved",
      }).select("trackingId wasteType address");
    }

    // Optimize route
    const optimized = optimizeRoute(bins, requests, {
      fillLevelThreshold,
      startLocation: startLocation || { lat: 6.9271, lng: 79.8612 },
      maxStops,
    });

    // Generate route name if not provided
    const generatedRouteName =
      routeName ||
      `Optimized Route - ${new Date().toISOString().split("T")[0]}`;

    // Create and save the optimized route
    const route = await Route.create({
      routeName: generatedRouteName,
      coordinatorId: coordinatorId || null,
      stops: optimized.stops,
      totalDistance: optimized.totalDistance,
      estimatedDuration: optimized.estimatedDuration,
      scheduledDate: new Date(),
      status: "draft",
    });

    return successResponse(
      res,
      "Route optimized and created successfully",
      {
        ...optimized,
        routeId: route._id,
        routeName: route.routeName,
        status: route.status,
      },
      201
    );
  } catch (error) {
    console.error("Error optimizing route:", error);
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
      stops = [],
      scheduledDate,
      totalDistance,
      estimatedDuration,
      status = "draft",
    } = req.body;

    // Validate route name is provided
    if (!routeName || routeName.trim().length === 0) {
      return errorResponse(res, "Route name is required", 400);
    }

    // For draft routes, allow empty stops and optional coordinatorId
    // For other statuses, require coordinatorId and at least one stop
    if (status !== "draft") {
      if (!coordinatorId) {
        return errorResponse(
          res,
          "Coordinator ID is required for non-draft routes",
          400
        );
      }
      if (!stops || stops.length === 0) {
        return errorResponse(
          res,
          "At least one stop is required for non-draft routes",
          400
        );
      }
    }

    const route = await Route.create({
      routeName: routeName.trim(),
      coordinatorId: coordinatorId || null,
      stops: stops || [],
      scheduledDate: scheduledDate || new Date(),
      totalDistance: totalDistance || 0,
      estimatedDuration: estimatedDuration || 0,
      status: status,
    });

    return successResponse(res, "Route created successfully", route, 201);
  } catch (error) {
    console.error("Error creating route:", error);
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
      return errorResponse(res, "Crew ID is required", 400);
    }

    // Validate that crewId references a user with role="crew"
    const crew = await User.findById(crewId);

    if (!crew) {
      return errorResponse(res, "Crew member not found", 404);
    }

    if (crew.role !== "crew") {
      return errorResponse(
        res,
        'User is not a crew member. Only users with role="crew" can be assigned to routes.',
        400
      );
    }

    if (crew.status !== "active") {
      return errorResponse(res, "Crew member is not active", 400);
    }

    // Check if crew is already assigned to an active route
    const existingAssignment = await Route.findOne({
      crewId: crewId,
      status: { $in: ["assigned", "in-progress"] },
    });

    if (existingAssignment) {
      return errorResponse(
        res,
        `Crew member is already assigned to route "${existingAssignment.routeName}" (${existingAssignment.status})`,
        400
      );
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return errorResponse(res, "Route not found", 404);
    }

    await route.assignToCrew(crewId, vehicleId);

    // Update crew profile if exists
    const crewProfile = await CrewProfile.findOne({ userId: crewId });
    if (crewProfile) {
      await crewProfile.assignToRoute(route._id);
    }

    // Update waste requests to scheduled status
    const requestStops = (route.stops || []).filter(
      (s) => s.stopType === "request"
    );
    if (requestStops.length > 0) {
      await WasteRequest.updateMany(
        { _id: { $in: requestStops.map((s) => s.referenceId) } },
        {
          status: "scheduled",
          scheduledDate: route.scheduledDate,
          routeId: route._id,
        }
      );
    }

    return successResponse(res, "Route assigned successfully", {
      routeId: route._id,
      routeName: route.routeName,
      crewId: route.crewId,
      crewName: crew.name,
      vehicleId: route.vehicleId,
      status: route.status,
    });
  } catch (error) {
    console.error("Error assigning route:", error);
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
      Route.find(req.dbQuery)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate("coordinatorId", "name email")
        .populate("crewId", "name phone"),
      Route.countDocuments(req.dbQuery),
    ]);

    const pagination = buildPaginationResponse(page, limit, total);

    return successResponse(
      res,
      "Routes retrieved successfully",
      routes,
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching routes:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get single route details
 * GET /api/coordinator/routes/:id
 */
exports.getRouteDetails = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate("coordinatorId", "name email phone")
      .populate("crewId", "name email phone");

    if (!route) {
      return errorResponse(res, "Route not found", 404);
    }

    return successResponse(res, "Route details retrieved", route);
  } catch (error) {
    console.error("Error fetching route details:", error);
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

    const validStatuses = [
      "draft",
      "assigned",
      "in-progress",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return errorResponse(res, "Route not found", 404);
    }

    route.status = status;

    if (status === "in-progress" && !route.startTime) {
      route.startTime = new Date();
    }

    if (status === "completed" && !route.endTime) {
      route.endTime = new Date();
      route.completionPercentage = 100;
    }

    await route.save();

    return successResponse(res, "Route status updated", {
      routeId: route._id,
      status: route.status,
    });
  } catch (error) {
    console.error("Error updating route status:", error);
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

    const validStatuses = ["pending", "completed", "skipped"];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const route = await Route.findById(req.params.id);

    if (!route) {
      return errorResponse(res, "Route not found", 404);
    }

    const index = parseInt(stopIndex);
    if (index < 0 || index >= route.stops.length) {
      return errorResponse(res, "Invalid stop index", 400);
    }

    route.updateStopStatus(index, status);
    await route.save();

    // If stop is a bin and completed, empty the bin
    if (status === "completed" && route.stops[index].stopType === "bin") {
      const bin = await SmartBin.findById(route.stops[index].referenceId);
      if (bin) {
        await bin.empty();
      }
    }

    // If stop is a request and completed, update request status
    if (status === "completed" && route.stops[index].stopType === "request") {
      const request = await WasteRequest.findById(
        route.stops[index].referenceId
      );
      if (request) {
        await request.complete();
      }
    }

    return successResponse(res, "Stop status updated", {
      routeId: route._id,
      stopIndex: index,
      stopStatus: status,
      routeCompletion: route.completionPercentage,
    });
  } catch (error) {
    console.error("Error updating stop status:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all crew members
 * GET /api/coordinator/crews
 */
exports.getCrews = async (req, res) => {
  try {
    // Ensure req.dbOptions exists and has proper defaults
    const dbOptions = req.dbOptions || {};
    const { page = 1, limit = 20, sort = {} } = dbOptions;
    const skip = (page - 1) * limit;

    // Build query for crew members
    const query = {
      role: "crew",
      ...(req.dbQuery || {}),
    };

    // Default sort by name - ensure sort is an object
    const sortObj = typeof sort === "object" && sort !== null ? sort : {};
    const sortOrder = Object.keys(sortObj).length > 0 ? sortObj : { name: 1 };

    // Execute queries with error handling
    let crews, total;
    try {
      [crews, total] = await Promise.all([
        User.find(query)
          .select("name email phone status lastLogin createdAt")
          .sort(sortOrder)
          .skip(skip)
          .limit(limit),
        User.countDocuments(query),
      ]);
    } catch (error) {
      console.error("Error executing crew queries:", error);
      console.error("Query:", JSON.stringify(query));
      console.error("Sort:", JSON.stringify(sortOrder));
      throw error;
    }

    if (!crews) {
      console.error("crews is undefined or null");
      throw new Error("Failed to fetch crews from database");
    }

    if (!Array.isArray(crews)) {
      console.error("crews is not an array:", typeof crews, crews);
      throw new Error("Invalid crews data format");
    }

    // Get crew profiles and current route assignments
    const crewsWithDetails = await Promise.all(
      crews.map(async (crew) => {
        try {
          // Validate crew object
          if (!crew || !crew._id) {
            console.error("Invalid crew object:", crew);
            return null;
          }

          const profile = await CrewProfile.findOne({ userId: crew._id });
          let currentRoute = null;

          // Fetch current route with error handling
          if (profile?.currentRouteId) {
            try {
              currentRoute = await Route.findById(
                profile.currentRouteId
              ).select("routeName status scheduledDate");
            } catch (routeError) {
              console.warn(
                `Failed to fetch route ${profile.currentRouteId}:`,
                routeError.message
              );
              currentRoute = null;
            }
          }

          return {
            ...crew.toObject(),
            profile: profile || null,
            currentRoute: currentRoute || null,
            availability: profile?.availability || "available",
          };
        } catch (error) {
          console.error(`Error processing crew ${crew._id}:`, error);
          return {
            ...crew.toObject(),
            profile: null,
            currentRoute: null,
            availability: "available",
          };
        }
      })
    ).then((results) => results.filter(Boolean)); // Remove null results

    // Ensure pagination parameters are valid numbers
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
    const validTotal = parseInt(total) || 0;

    const pagination = buildPaginationResponse(
      validPage,
      validLimit,
      validTotal
    );

    return successResponse(
      res,
      "Crew members retrieved successfully",
      crewsWithDetails,
      200,
      pagination
    );
  } catch (error) {
    console.error("Error fetching crews:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create new crew member
 * POST /api/coordinator/crews
 */
exports.createCrew = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleId, address } = req.body;

    if (!name || !email || !phone || !password) {
      return errorResponse(
        res,
        "Name, email, phone, and password are required",
        400
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, "Email already registered", 400);
    }

    // Create crew user
    const crew = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: "crew",
      status: "active",
      address: address || {},
    });

    // Create crew profile
    const crewProfile = await CrewProfile.create({
      userId: crew._id,
      vehicleId: vehicleId || null,
      availability: "available",
    });

    // Remove password from response
    const crewResponse = crew.toObject();
    delete crewResponse.password;

    return successResponse(
      res,
      "Crew member created successfully",
      {
        crew: crewResponse,
        profile: crewProfile,
      },
      201
    );
  } catch (error) {
    console.error("Error creating crew:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get crew details
 * GET /api/coordinator/crews/:id
 */
exports.getCrewDetails = async (req, res) => {
  try {
    const crew = await User.findById(req.params.id).select("-password");

    if (!crew) {
      return errorResponse(res, "Crew member not found", 404);
    }

    if (crew.role !== "crew") {
      return errorResponse(res, "User is not a crew member", 400);
    }

    // Get crew profile
    let profile = await CrewProfile.findOne({ userId: crew._id });

    // Create profile if doesn't exist
    if (!profile) {
      profile = await CrewProfile.create({ userId: crew._id });
    }

    // Get current route if assigned
    let currentRoute = null;
    if (profile.currentRouteId) {
      currentRoute = await Route.findById(profile.currentRouteId).populate(
        "coordinatorId",
        "name phone"
      );
    }

    // Get route history (last 10 completed routes)
    const routeHistory = await Route.find({
      crewId: crew._id,
      status: "completed",
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .select(
        "routeName scheduledDate completedAt totalDistance completionPercentage"
      );

    const crewDetails = {
      crew: crew.toObject(),
      profile: profile,
      currentRoute: currentRoute,
      routeHistory: routeHistory,
    };

    return successResponse(res, "Crew details retrieved", crewDetails);
  } catch (error) {
    console.error("Error fetching crew details:", error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update crew availability
 * PUT /api/coordinator/crews/:id/availability
 */
exports.updateCrewAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    if (!availability) {
      return errorResponse(res, "Availability status is required", 400);
    }

    const validStatuses = ["available", "assigned", "unavailable", "on-leave"];
    if (!validStatuses.includes(availability)) {
      return errorResponse(
        res,
        `Invalid availability. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    const crew = await User.findById(req.params.id);

    if (!crew) {
      return errorResponse(res, "Crew member not found", 404);
    }

    if (crew.role !== "crew") {
      return errorResponse(res, "User is not a crew member", 400);
    }

    // Get or create crew profile
    let profile = await CrewProfile.findOne({ userId: crew._id });
    if (!profile) {
      profile = await CrewProfile.create({ userId: crew._id });
    }

    // Update availability
    await profile.updateAvailability(availability);

    return successResponse(res, "Crew availability updated successfully", {
      crewId: crew._id,
      crewName: crew.name,
      availability: profile.availability,
      currentRoute: profile.currentRouteId,
    });
  } catch (error) {
    console.error("Error updating crew availability:", error);
    return errorResponse(res, error.message, 500);
  }
};

