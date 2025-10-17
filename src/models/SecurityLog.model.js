const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        'login-success',
        'login-failed',
        'logout',
        'password-change',
        'password-reset',
        'role-change',
        'account-locked',
        'account-unlocked',
        'suspicious-activity',
        'unauthorized-access',
        'data-export',
        'settings-change',
        'user-created',
        'user-deleted'
      ],
      required: [true, 'Event type is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: 'User affected by the action (for admin actions)'
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required']
    },
    userAgent: {
      type: String
    },
    deviceInfo: {
      browser: String,
      os: String,
      device: String
    },
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    success: {
      type: Boolean,
      default: true
    },
    failureReason: {
      type: String
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      description: 'Additional event-specific details'
    },
    sessionId: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
securityLogSchema.index({ eventType: 1, createdAt: -1 });
securityLogSchema.index({ userId: 1, createdAt: -1 });
securityLogSchema.index({ ipAddress: 1, createdAt: -1 });
securityLogSchema.index({ success: 1, eventType: 1 });
securityLogSchema.index({ severity: 1, createdAt: -1 });
securityLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete old logs (based on privacy settings retention)
// Default: delete logs older than 1 year
securityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static method to log an event
securityLogSchema.statics.logEvent = async function (eventData) {
  try {
    return await this.create(eventData);
  } catch (error) {
    console.error('Failed to create security log:', error);
    // Don't throw error to prevent blocking main operation
    return null;
  }
};

// Static method to check for suspicious activity
securityLogSchema.statics.checkSuspiciousActivity = async function (userId, ipAddress, timeWindowMinutes = 30) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  // Count failed login attempts
  const failedAttempts = await this.countDocuments({
    userId,
    eventType: 'login-failed',
    createdAt: { $gte: timeWindow }
  });
  
  // Count different IP addresses used
  const distinctIPs = await this.distinct('ipAddress', {
    userId,
    eventType: { $in: ['login-success', 'login-failed'] },
    createdAt: { $gte: timeWindow }
  });
  
  return {
    failedAttempts,
    ipCount: distinctIPs.length,
    suspicious: failedAttempts >= 5 || distinctIPs.length >= 3
  };
};

// Static method to get recent events for user
securityLogSchema.statics.getUserActivity = async function (userId, limit = 50) {
  return await this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('eventType ipAddress success createdAt deviceInfo location');
};

// Virtual for display message
securityLogSchema.virtual('displayMessage').get(function () {
  const messages = {
    'login-success': 'User logged in successfully',
    'login-failed': 'Failed login attempt',
    'logout': 'User logged out',
    'password-change': 'Password changed',
    'password-reset': 'Password reset',
    'role-change': 'User role changed',
    'account-locked': 'Account locked due to suspicious activity',
    'account-unlocked': 'Account unlocked',
    'suspicious-activity': 'Suspicious activity detected',
    'unauthorized-access': 'Unauthorized access attempt',
    'data-export': 'Data exported',
    'settings-change': 'Settings changed',
    'user-created': 'New user created',
    'user-deleted': 'User deleted'
  };
  return messages[this.eventType] || this.eventType;
});

// Virtual for risk level based on severity
securityLogSchema.virtual('riskLevel').get(function () {
  if (!this.success) return 'high';
  
  const highRiskEvents = ['account-locked', 'suspicious-activity', 'unauthorized-access'];
  if (highRiskEvents.includes(this.eventType)) return 'high';
  
  return this.severity;
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);

