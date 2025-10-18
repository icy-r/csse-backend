const Issue = require('../models/Issue.model');
const User = require('../models/User.model');
const Route = require('../models/Route.model');
const { successResponse, errorResponse } = require('../utils/response');
const { buildPaginationResponse } = require('../middleware/queryBuilder');

/**
 * Report a new issue
 * POST /api/issues
 */
exports.createIssue = async (req, res) => {
  try {
    const { crewId, routeId, issueType, description, location, stopIndex, priority } = req.body;
    
    if (!crewId || !issueType || !description) {
      return errorResponse(res, 'Crew ID, issue type, and description are required', 400);
    }
    
    // Verify crew exists
    const crew = await User.findById(crewId);
    if (!crew || crew.role !== 'crew') {
      return errorResponse(res, 'Crew member not found', 404);
    }
    
    // Verify route exists if provided
    if (routeId) {
      const route = await Route.findById(routeId);
      if (!route) {
        return errorResponse(res, 'Route not found', 404);
      }
    }
    
    // Auto-assign priority based on issue type
    let issuePriority = priority || 'medium';
    if (issueType === 'safety-hazard') {
      issuePriority = 'critical';
    } else if (issueType === 'vehicle-issue') {
      issuePriority = 'high';
    }
    
    const issue = await Issue.create({
      crewId,
      routeId: routeId || null,
      issueType,
      description,
      location: location || 'Not specified',
      stopIndex: stopIndex !== undefined ? stopIndex : null,
      priority: issuePriority
    });
    
    // Populate crew details
    await issue.populate('crewId', 'name email phone');
    if (routeId) {
      await issue.populate('routeId', 'routeName scheduledDate');
    }
    
    return successResponse(res, 'Issue reported successfully', issue, 201);
    
  } catch (error) {
    console.error('Error creating issue:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get all issues with filters
 * GET /api/issues
 */
exports.getIssues = async (req, res) => {
  try {
    const { page, limit, sort } = req.dbOptions;
    const skip = (page - 1) * limit;
    
    // Build query from dbQuery (populated by queryBuilder middleware)
    const query = { ...req.dbQuery };
    
    // Additional filters from query params
    const { crewId, status, issueType, priority, routeId } = req.query;
    
    if (crewId) query.crewId = crewId;
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (priority) query.priority = priority;
    if (routeId) query.routeId = routeId;
    
    // Default sort by reportedAt descending
    const sortOrder = Object.keys(sort).length > 0 ? sort : { reportedAt: -1 };
    
    const [issues, total] = await Promise.all([
      Issue
        .find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate('crewId', 'name email phone')
        .populate('routeId', 'routeName scheduledDate status')
        .populate('resolvedBy', 'name email')
        .populate('comments.userId', 'name'),
      Issue.countDocuments(query)
    ]);
    
    const pagination = buildPaginationResponse(page, limit, total);
    
    return successResponse(res, 'Issues retrieved successfully', issues, 200, pagination);
    
  } catch (error) {
    console.error('Error fetching issues:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get issue by ID
 * GET /api/issues/:id
 */
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue
      .findById(req.params.id)
      .populate('crewId', 'name email phone')
      .populate('routeId', 'routeName scheduledDate status stops')
      .populate('resolvedBy', 'name email')
      .populate('comments.userId', 'name role');
    
    if (!issue) {
      return errorResponse(res, 'Issue not found', 404);
    }
    
    return successResponse(res, 'Issue retrieved successfully', issue);
    
  } catch (error) {
    console.error('Error fetching issue:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update issue status
 * PUT /api/issues/:id/status
 */
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, resolvedBy, resolution } = req.body;
    
    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }
    
    const validStatuses = ['reported', 'acknowledged', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return errorResponse(res, 'Issue not found', 404);
    }
    
    // Update status based on type
    if (status === 'acknowledged') {
      await issue.acknowledge();
    } else if (status === 'resolved') {
      if (!resolution) {
        return errorResponse(res, 'Resolution is required when marking issue as resolved', 400);
      }
      await issue.resolve(resolvedBy, resolution);
    } else if (status === 'closed') {
      await issue.close();
    } else {
      issue.status = status;
      await issue.save();
    }
    
    // Populate for response
    await issue.populate('crewId', 'name email phone');
    await issue.populate('resolvedBy', 'name email');
    
    return successResponse(res, 'Issue status updated successfully', issue);
    
  } catch (error) {
    console.error('Error updating issue status:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Update issue priority
 * PUT /api/issues/:id/priority
 */
exports.updateIssuePriority = async (req, res) => {
  try {
    const { priority } = req.body;
    
    if (!priority) {
      return errorResponse(res, 'Priority is required', 400);
    }
    
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (!validPriorities.includes(priority)) {
      return errorResponse(res, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400);
    }
    
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return errorResponse(res, 'Issue not found', 404);
    }
    
    await issue.updatePriority(priority);
    
    await issue.populate('crewId', 'name email phone');
    
    return successResponse(res, 'Issue priority updated successfully', issue);
    
  } catch (error) {
    console.error('Error updating issue priority:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Add comment to issue
 * POST /api/issues/:id/comments
 */
exports.addComment = async (req, res) => {
  try {
    const { userId, comment } = req.body;
    
    if (!userId || !comment) {
      return errorResponse(res, 'User ID and comment are required', 400);
    }
    
    if (comment.length > 500) {
      return errorResponse(res, 'Comment must be 500 characters or less', 400);
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return errorResponse(res, 'Issue not found', 404);
    }
    
    await issue.addComment(userId, comment);
    
    // Populate for response
    await issue.populate('crewId', 'name email phone');
    await issue.populate('comments.userId', 'name role');
    
    return successResponse(res, 'Comment added successfully', issue);
    
  } catch (error) {
    console.error('Error adding comment:', error);
    return errorResponse(res, error.message, 500);
  }
};

/**
 * Get issue statistics
 * GET /api/issues/stats
 */
exports.getIssueStats = async (req, res) => {
  try {
    const [
      totalIssues,
      reportedIssues,
      inProgressIssues,
      resolvedIssues,
      criticalIssues,
      highPriorityIssues
    ] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'reported' }),
      Issue.countDocuments({ status: 'in-progress' }),
      Issue.countDocuments({ status: 'resolved' }),
      Issue.countDocuments({ priority: 'critical' }),
      Issue.countDocuments({ priority: 'high' })
    ]);
    
    // Get issues by type
    const issuesByType = await Issue.aggregate([
      {
        $group: {
          _id: '$issueType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      total: totalIssues,
      byStatus: {
        reported: reportedIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues
      },
      byPriority: {
        critical: criticalIssues,
        high: highPriorityIssues
      },
      byType: issuesByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    return successResponse(res, 'Issue statistics retrieved successfully', stats);
    
  } catch (error) {
    console.error('Error fetching issue stats:', error);
    return errorResponse(res, error.message, 500);
  }
};

module.exports = exports;

