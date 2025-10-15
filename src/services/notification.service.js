/**
 * Notification Service
 * Basic structure for future push notifications
 * Currently returns mock data for MVP
 */

/**
 * Send notification to user
 * @param {String} userId - User ID
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Notification result
 */
exports.sendNotification = async (userId, title, message, data = {}) => {
  // TODO: Implement push notification (Firebase FCM, OneSignal, etc.)
  console.log(`📬 Notification for user ${userId}: ${title} - ${message}`);
  
  return {
    success: true,
    userId,
    title,
    message,
    sentAt: new Date(),
    method: 'in-app' // MVP: in-app only
  };
};

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Notification results
 */
exports.sendBulkNotification = async (userIds, title, message, data = {}) => {
  // TODO: Implement bulk push notification
  console.log(`📬 Bulk notification to ${userIds.length} users: ${title}`);
  
  return {
    success: true,
    recipientCount: userIds.length,
    title,
    message,
    sentAt: new Date(),
    method: 'in-app'
  };
};

/**
 * Send request status update notification
 * @param {Object} request - Waste request object
 * @param {String} newStatus - New status
 * @returns {Promise<Object>} Notification result
 */
exports.notifyRequestStatusUpdate = async (request, newStatus) => {
  const messages = {
    approved: `Your waste collection request ${request.trackingId} has been approved!`,
    rejected: `Your waste collection request ${request.trackingId} has been rejected.`,
    scheduled: `Your waste collection has been scheduled for ${request.scheduledDate}.`,
    'in-progress': `Collection crew is on the way to your location!`,
    completed: `Your waste collection has been completed. Thank you!`
  };
  
  return exports.sendNotification(
    request.userId.toString(),
    'Request Status Update',
    messages[newStatus] || `Your request status has been updated to ${newStatus}`,
    {
      requestId: request._id,
      trackingId: request.trackingId,
      status: newStatus
    }
  );
};

/**
 * Send route assignment notification to crew
 * @param {Object} route - Route object
 * @param {String} crewId - Crew member ID
 * @returns {Promise<Object>} Notification result
 */
exports.notifyRouteAssignment = async (route, crewId) => {
  return exports.sendNotification(
    crewId.toString(),
    'New Route Assigned',
    `You have been assigned to route "${route.routeName}" with ${route.stops.length} stops.`,
    {
      routeId: route._id,
      routeName: route.routeName,
      stopsCount: route.stops.length,
      scheduledDate: route.scheduledDate
    }
  );
};

/**
 * Send work order assignment notification to technician
 * @param {Object} workOrder - Work order object
 * @param {String} technicianId - Technician ID
 * @returns {Promise<Object>} Notification result
 */
exports.notifyWorkOrderAssignment = async (workOrder, technicianId) => {
  return exports.sendNotification(
    technicianId.toString(),
    'New Work Order',
    `New ${workOrder.priority} priority work order assigned: ${workOrder.workOrderId}`,
    {
      workOrderId: workOrder._id,
      priority: workOrder.priority,
      deviceId: workOrder.deviceId
    }
  );
};

/**
 * Send bin full alert to coordinators
 * @param {Object} bin - Smart bin object
 * @param {Array} coordinatorIds - Array of coordinator IDs
 * @returns {Promise<Object>} Notification result
 */
exports.notifyBinFull = async (bin, coordinatorIds) => {
  return exports.sendBulkNotification(
    coordinatorIds.map(id => id.toString()),
    'Bin Full Alert',
    `Bin ${bin.binId} at ${bin.location.address} is ${bin.fillLevel}% full and needs collection.`,
    {
      binId: bin._id,
      fillLevel: bin.fillLevel,
      location: bin.location
    }
  );
};

/**
 * Send device offline alert to technicians
 * @param {Object} device - Device object
 * @param {Array} technicianIds - Array of technician IDs
 * @returns {Promise<Object>} Notification result
 */
exports.notifyDeviceOffline = async (device, technicianIds) => {
  return exports.sendBulkNotification(
    technicianIds.map(id => id.toString()),
    'Device Offline',
    `Device ${device.deviceId} has gone offline and may need attention.`,
    {
      deviceId: device._id,
      lastSignal: device.lastSignal
    }
  );
};

