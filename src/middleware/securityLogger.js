const SecurityLog = require('../models/SecurityLog.model');

/**
 * Security logging middleware
 * Logs authentication and security-related events
 * NO AUTHENTICATION REQUIRED - just logging
 */

/**
 * Log security event helper function
 */
const logSecurityEvent = async (eventType, req, additionalData = {}) => {
  try {
    const logData = {
      eventType,
      userId: additionalData.userId || req.body?.userId || req.query?.userId || null,
      targetUserId: additionalData.targetUserId || null,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      success: additionalData.success !== undefined ? additionalData.success : true,
      failureReason: additionalData.failureReason || null,
      severity: additionalData.severity || 'low',
      details: additionalData.details || {},
      sessionId: req.sessionID || null
    };

    // Parse device info from user agent
    const userAgent = req.get('user-agent') || '';
    logData.deviceInfo = {
      browser: parseBrowser(userAgent),
      os: parseOS(userAgent),
      device: parseDevice(userAgent)
    };

    await SecurityLog.logEvent(logData);
  } catch (error) {
    // Don't throw error, just log it
    console.error('Failed to log security event:', error);
  }
};

/**
 * Parse browser from user agent
 */
function parseBrowser(userAgent) {
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  if (/edge/i.test(userAgent)) return 'Edge';
  if (/opera/i.test(userAgent)) return 'Opera';
  return 'Unknown';
}

/**
 * Parse OS from user agent
 */
function parseOS(userAgent) {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/mac/i.test(userAgent)) return 'MacOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/android/i.test(userAgent)) return 'Android';
  if (/ios|iphone|ipad/i.test(userAgent)) return 'iOS';
  return 'Unknown';
}

/**
 * Parse device type from user agent
 */
function parseDevice(userAgent) {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

/**
 * Middleware to log login attempts
 * Call this in your login route after authentication
 */
const logLoginAttempt = (success = true, failureReason = null) => {
  return async (req, res, next) => {
    await logSecurityEvent(
      success ? 'login-success' : 'login-failed',
      req,
      {
        success,
        failureReason,
        severity: success ? 'low' : 'medium',
        details: {
          email: req.body?.email,
          timestamp: new Date()
        }
      }
    );
    next();
  };
};

/**
 * Middleware to log logout events
 */
const logLogout = async (req, res, next) => {
  await logSecurityEvent('logout', req, {
    severity: 'low',
    details: {
      timestamp: new Date()
    }
  });
  next();
};

/**
 * Middleware to log password changes
 */
const logPasswordChange = async (req, res, next) => {
  await logSecurityEvent('password-change', req, {
    severity: 'medium',
    details: {
      timestamp: new Date()
    }
  });
  next();
};

/**
 * Middleware to log role changes
 */
const logRoleChange = async (req, res, next) => {
  await logSecurityEvent('role-change', req, {
    targetUserId: req.params.id || req.body.userId,
    severity: 'high',
    details: {
      newRole: req.body.role,
      timestamp: new Date()
    }
  });
  next();
};

/**
 * Middleware to log data exports
 */
const logDataExport = async (req, res, next) => {
  await logSecurityEvent('data-export', req, {
    severity: 'medium',
    details: {
      exportType: req.query.type || 'unknown',
      format: req.query.format || 'unknown',
      timestamp: new Date()
    }
  });
  next();
};

/**
 * Middleware to log settings changes
 */
const logSettingsChange = async (req, res, next) => {
  await logSecurityEvent('settings-change', req, {
    severity: 'medium',
    details: {
      settingsType: req.path.includes('privacy') ? 'privacy' : 
                    req.path.includes('billing') ? 'billing' : 
                    req.path.includes('security') ? 'security' : 'general',
      timestamp: new Date()
    }
  });
  next();
};

/**
 * Middleware to log suspicious activity
 */
const logSuspiciousActivity = async (req, reason) => {
  await logSecurityEvent('suspicious-activity', req, {
    success: false,
    severity: 'high',
    failureReason: reason,
    details: {
      reason,
      timestamp: new Date()
    }
  });
};

/**
 * Check for suspicious activity and log if detected
 */
const checkSuspiciousActivity = async (req, res, next) => {
  try {
    const userId = req.body?.userId || req.query?.userId;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (userId) {
      const suspicious = await SecurityLog.checkSuspiciousActivity(userId, ipAddress);
      
      if (suspicious.suspicious) {
        await logSuspiciousActivity(req, `Multiple failed attempts or IP changes detected`);
        
        // Optionally, you could block the request here
        // return res.status(429).json({ 
        //   success: false, 
        //   message: 'Too many failed attempts. Please try again later.' 
        // });
      }
    }
  } catch (error) {
    console.error('Error checking suspicious activity:', error);
  }
  
  next();
};

module.exports = {
  logSecurityEvent,
  logLoginAttempt,
  logLogout,
  logPasswordChange,
  logRoleChange,
  logDataExport,
  logSettingsChange,
  logSuspiciousActivity,
  checkSuspiciousActivity
};

