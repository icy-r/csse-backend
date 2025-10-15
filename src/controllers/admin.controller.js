const User = require('../models/User.model');
const WasteRequest = require('../models/WasteRequest.model');
const SmartBin = require('../models/SmartBin.model');
const Route = require('../models/Route.model');
const WorkOrder = require('../models/WorkOrder.model');
const Device = require('../models/Device.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');
const mongoose = require('mongoose');

/**
 * Get all users with filtering
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    const sortOrder = Object.keys(sort).length > 0 ? sort : { createdAt: -1 };
    
    const [users, total] = await Promise.all([
      User
        .find(req.dbQuery)
        .select('-__v')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit),
      User.countDocuments(req.dbQuery)
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Users retrieved successfully', users, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Create new user
 * POST /api/admin/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, role, address, status } = req.body;
    
    if (!name || !email || !phone || !role) {
      return errorResponse(res, 'Missing required fields (name, email, phone, role)', 400);
    }
    
    const user = await User.create({
      name,
      email,
      phone,
      role,
      address: address || {},
      status: status || 'active'
    });
    
    return successResponse(res, 'User created successfully', user, 201);
    
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update user role and status
 * PUT /api/admin/users/:id/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { role, status } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    if (role) {
      const validRoles = ['citizen', 'coordinator', 'technician', 'admin'];
      if (!validRoles.includes(role)) {
        return errorResponse(res, 'Invalid role', 400);
      }
      user.role = role;
    }
    
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Invalid status', 400);
      }
      user.status = status;
    }
    
    await user.save();
    
    return successResponse(res, 'User updated successfully', {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Delete/deactivate user
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Soft delete: set status to inactive
    user.status = 'inactive';
    await user.save();
    
    return successResponse(res, 'User deactivated successfully', {
      userId: user._id,
      status: user.status
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get collection reports
 * GET /api/admin/reports/collections
 */
exports.getCollectionReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const dateQuery = hasDateFilter ? { createdAt: dateFilter } : {};
    
    // Total collections
    const totalCollections = await WasteRequest.countDocuments({
      ...dateQuery,
      status: 'completed'
    });
    
    // Collections by waste type
    const collectionsByType = await WasteRequest.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $group: { _id: '$wasteType', count: { $sum: 1 } } }
    ]);
    
    // Average response time (from creation to completion)
    const avgResponseTime = await WasteRequest.aggregate([
      { $match: { status: 'completed', completedDate: { $exists: true }, ...dateQuery } },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$completedDate', '$createdAt'] },
              1000 * 60 * 60 // Convert to hours
            ]
          }
        }
      },
      { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
    ]);
    
    // Completion rate
    const totalRequests = await WasteRequest.countDocuments(dateQuery);
    const completionRate = totalRequests > 0 
      ? Math.round((totalCollections / totalRequests) * 100) 
      : 0;
    
    // On-time completion (completed before or on preferred date)
    const onTimeCompletions = await WasteRequest.countDocuments({
      ...dateQuery,
      status: 'completed',
      $expr: { $lte: ['$completedDate', '$preferredDate'] }
    });
    
    const onTimeRate = totalCollections > 0
      ? Math.round((onTimeCompletions / totalCollections) * 100)
      : 0;
    
    const report = {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      totalCollections,
      totalRequests,
      completionRate: `${completionRate}%`,
      onTimeRate: `${onTimeRate}%`,
      avgResponseTime: avgResponseTime[0]?.avgTime 
        ? `${Math.round(avgResponseTime[0].avgTime * 10) / 10} hours`
        : 'N/A',
      collectionsByType: collectionsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      generatedAt: new Date()
    };
    
    return successResponse(res, 'Collection reports retrieved', report);
    
  } catch (error) {
    console.error('Error generating collection reports:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get route efficiency reports
 * GET /api/admin/reports/efficiency
 */
exports.getEfficiencyReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    const dateQuery = hasDateFilter ? { createdAt: dateFilter } : {};
    
    // Total routes completed
    const totalRoutes = await Route.countDocuments({
      ...dateQuery,
      status: 'completed'
    });
    
    // Average completion percentage
    const avgCompletion = await Route.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $group: { _id: null, avg: { $avg: '$completionPercentage' } } }
    ]);
    
    // Total distance covered
    const totalDistance = await Route.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $group: { _id: null, total: { $sum: '$totalDistance' } } }
    ]);
    
    // Average stops per route
    const avgStops = await Route.aggregate([
      { $match: { status: 'completed', ...dateQuery } },
      { $project: { stopsCount: { $size: '$stops' } } },
      { $group: { _id: null, avg: { $avg: '$stopsCount' } } }
    ]);
    
    // Fuel efficiency estimate (distance per route)
    const avgDistance = totalRoutes > 0 
      ? (totalDistance[0]?.total || 0) / totalRoutes 
      : 0;
    
    // Estimated fuel savings (compared to inefficient routing - mock calculation)
    const estimatedSavings = avgDistance > 0 
      ? Math.round((avgDistance * 0.2) * totalRoutes) // 20% improvement assumption
      : 0;
    
    const report = {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      totalRoutes,
      avgCompletionRate: avgCompletion[0]?.avg 
        ? `${Math.round(avgCompletion[0].avg)}%`
        : 'N/A',
      totalDistance: totalDistance[0]?.total 
        ? `${Math.round(totalDistance[0].total * 10) / 10} km`
        : 'N/A',
      avgDistancePerRoute: avgDistance 
        ? `${Math.round(avgDistance * 10) / 10} km`
        : 'N/A',
      avgStopsPerRoute: avgStops[0]?.avg 
        ? Math.round(avgStops[0].avg)
        : 0,
      estimatedFuelSavings: `${estimatedSavings} km`,
      generatedAt: new Date()
    };
    
    return successResponse(res, 'Efficiency reports retrieved', report);
    
  } catch (error) {
    console.error('Error generating efficiency reports:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get device uptime reports
 * GET /api/admin/reports/devices
 */
exports.getDeviceReports = async (req, res) => {
  try {
    // Total devices
    const [totalDevices, activeDevices, offlineDevices] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ status: 'active' }),
      Device.countDocuments({ status: 'offline' })
    ]);
    
    // Device uptime percentage
    const uptimePercentage = totalDevices > 0
      ? Math.round((activeDevices / totalDevices) * 100)
      : 0;
    
    // Total work orders
    const [totalWorkOrders, resolvedWorkOrders, pendingWorkOrders] = await Promise.all([
      WorkOrder.countDocuments(),
      WorkOrder.countDocuments({ status: 'resolved' }),
      WorkOrder.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } })
    ]);
    
    // Average resolution time
    const avgResolutionTime = await WorkOrder.aggregate([
      { $match: { status: 'resolved', actualResolutionTime: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$actualResolutionTime' } } }
    ]);
    
    // First-time fix rate (resolved without escalation)
    const firstTimeFix = await WorkOrder.countDocuments({
      status: 'resolved',
      actionTaken: { $in: ['repaired', 'replaced'] }
    });
    
    const fixRate = resolvedWorkOrders > 0
      ? Math.round((firstTimeFix / resolvedWorkOrders) * 100)
      : 0;
    
    const report = {
      devices: {
        total: totalDevices,
        active: activeDevices,
        offline: offlineDevices,
        decommissioned: totalDevices - activeDevices - offlineDevices,
        uptimePercentage: `${uptimePercentage}%`
      },
      workOrders: {
        total: totalWorkOrders,
        resolved: resolvedWorkOrders,
        pending: pendingWorkOrders,
        resolutionRate: totalWorkOrders > 0 
          ? `${Math.round((resolvedWorkOrders / totalWorkOrders) * 100)}%`
          : 'N/A',
        avgResolutionTime: avgResolutionTime[0]?.avg 
          ? `${Math.round(avgResolutionTime[0].avg)} minutes`
          : 'N/A',
        firstTimeFixRate: `${fixRate}%`
      },
      generatedAt: new Date()
    };
    
    return successResponse(res, 'Device reports retrieved', report);
    
  } catch (error) {
    console.error('Error generating device reports:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get system health status
 * GET /api/admin/system/health
 */
exports.getSystemHealth = async (req, res) => {
  try {
    // Database connection status
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Count active entities
    const [users, bins, routes, devices] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      SmartBin.countDocuments({ status: 'active' }),
      Route.countDocuments({ status: { $in: ['assigned', 'in-progress'] } }),
      Device.countDocuments({ status: 'active' })
    ]);
    
    // Recent activity
    const recentRequests = await WasteRequest.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    const recentRoutes = await Route.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      database: {
        status: dbStatus,
        host: mongoose.connection.host || 'unknown'
      },
      activeEntities: {
        users,
        smartBins: bins,
        activeRoutes: routes,
        activeDevices: devices
      },
      recentActivity: {
        requestsLast24h: recentRequests,
        routesLast24h: recentRoutes
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    return successResponse(res, 'System health retrieved', health);
    
  } catch (error) {
    console.error('Error fetching system health:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Export data (generate data dump)
 * GET /api/admin/export
 */
exports.exportData = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let data = {};
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    const hasDateFilter = Object.keys(dateFilter).length > 0;
    
    switch (type) {
      case 'users':
        data.users = await User.find().select('-__v');
        break;
        
      case 'requests':
        const requestQuery = hasDateFilter ? { createdAt: dateFilter } : {};
        data.requests = await WasteRequest.find(requestQuery)
          .populate('userId', 'name email')
          .select('-__v');
        break;
        
      case 'routes':
        const routeQuery = hasDateFilter ? { createdAt: dateFilter } : {};
        data.routes = await Route.find(routeQuery)
          .populate('coordinatorId crewId', 'name email')
          .select('-__v');
        break;
        
      case 'devices':
        data.devices = await Device.find().populate('binId', 'binId location');
        break;
        
      case 'all':
        data = {
          users: await User.find().select('-__v'),
          bins: await SmartBin.find().select('-__v'),
          requests: await WasteRequest.find(hasDateFilter ? { createdAt: dateFilter } : {}),
          routes: await Route.find(hasDateFilter ? { createdAt: dateFilter } : {}),
          devices: await Device.find(),
          workOrders: await WorkOrder.find(hasDateFilter ? { createdAt: dateFilter } : {})
        };
        break;
        
      default:
        return errorResponse(res, 'Invalid export type. Use: users, requests, routes, devices, or all', 400);
    }
    
    data.exportMetadata = {
      type,
      startDate: startDate || 'All time',
      endDate: endDate || 'Present',
      exportedAt: new Date(),
      recordCount: Object.keys(data).reduce((sum, key) => {
        if (key !== 'exportMetadata') {
          return sum + (Array.isArray(data[key]) ? data[key].length : 0);
        }
        return sum;
      }, 0)
    };
    
    return successResponse(res, 'Data exported successfully', data);
    
  } catch (error) {
    console.error('Error exporting data:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
exports.getDashboard = async (req, res) => {
  try {
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ status: 'active' }),
        byRole: await User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      },
      requests: {
        total: await WasteRequest.countDocuments(),
        pending: await WasteRequest.countDocuments({ status: 'pending' }),
        completed: await WasteRequest.countDocuments({ status: 'completed' }),
        thisMonth: await WasteRequest.countDocuments({
          createdAt: { $gte: new Date(new Date().setDate(1)) }
        })
      },
      bins: {
        total: await SmartBin.countDocuments(),
        full: await SmartBin.countDocuments({ fillLevel: { $gte: 90 } }),
        active: await SmartBin.countDocuments({ status: 'active' })
      },
      routes: {
        total: await Route.countDocuments(),
        active: await Route.countDocuments({ status: { $in: ['assigned', 'in-progress'] } }),
        completed: await Route.countDocuments({ status: 'completed' })
      },
      devices: {
        total: await Device.countDocuments(),
        active: await Device.countDocuments({ status: 'active' }),
        offline: await Device.countDocuments({ status: 'offline' })
      },
      workOrders: {
        total: await WorkOrder.countDocuments(),
        pending: await WorkOrder.countDocuments({ status: { $in: ['pending', 'assigned'] } }),
        resolved: await WorkOrder.countDocuments({ status: 'resolved' })
      }
    };
    
    return successResponse(res, 'Dashboard statistics retrieved', stats);
    
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return errorResponse(res, error.message, 500);
  }
};

