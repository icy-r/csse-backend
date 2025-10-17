const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      unique: true,
    },
    deviceType: {
      type: String,
      enum: ["rfid", "qr-code", "sensor"],
      required: [true, "Device type is required"],
    },
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmartBin",
    },
    status: {
      type: String,
      enum: ["active", "offline", "decommissioned", "error"],
      default: "active",
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    lastSignal: Date,
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    firmwareVersion: String,
    errorLog: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        errorCode: String,
        description: String,
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
      },
    ],
    maintenanceHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        action: String,
        technicianId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        notes: String,
        workOrderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "WorkOrder",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Indexes (deviceId already indexed via unique: true)
deviceSchema.index({ status: 1 });
deviceSchema.index({ binId: 1 });
deviceSchema.index({ deviceType: 1, status: 1 });

// Virtual for days since last signal
deviceSchema.virtual('daysSinceLastSignal').get(function() {
  if (!this.lastSignal) return null;
  const today = new Date();
  const diff = today - this.lastSignal;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for battery status
deviceSchema.virtual('batteryStatus').get(function() {
  if (!this.batteryLevel) return 'unknown';
  if (this.batteryLevel < 20) return 'critical';
  if (this.batteryLevel < 50) return 'low';
  return 'good';
});

// Virtual for is online
deviceSchema.virtual('isOnline').get(function() {
  if (!this.lastSignal) return false;
  const hoursSinceSignal = (new Date() - this.lastSignal) / (1000 * 60 * 60);
  return hoursSinceSignal < 2; // Consider online if signal within 2 hours
});

// Method to update signal
deviceSchema.methods.updateSignal = function(batteryLevel = null) {
  this.lastSignal = new Date();
  if (batteryLevel !== null) {
    this.batteryLevel = batteryLevel;
  }
  if (this.status === 'offline') {
    this.status = 'active';
  }
  return this.save();
};

// Method to add error log
deviceSchema.methods.addError = function(errorCode, description, severity = 'medium') {
  this.errorLog.push({
    timestamp: new Date(),
    errorCode,
    description,
    severity
  });
  
  // Keep only last 100 errors
  if (this.errorLog.length > 100) {
    this.errorLog = this.errorLog.slice(-100);
  }
  
  return this.save();
};

// Method to add maintenance record
deviceSchema.methods.addMaintenance = function(action, technicianId, notes, workOrderId = null) {
  this.maintenanceHistory.push({
    date: new Date(),
    action,
    technicianId,
    notes,
    workOrderId
  });
  
  // Keep only last 50 maintenance records
  if (this.maintenanceHistory.length > 50) {
    this.maintenanceHistory = this.maintenanceHistory.slice(-50);
  }
  
  return this.save();
};

// Method to decommission device
deviceSchema.methods.decommission = function() {
  this.status = 'decommissioned';
  this.binId = null;
  return this.save();
};

// Method to reactivate device
deviceSchema.methods.reactivate = function(binId = null) {
  if (this.status === 'decommissioned') {
    throw new Error('Decommissioned devices cannot be reactivated');
  }
  this.status = 'active';
  if (binId) {
    this.binId = binId;
  }
  return this.save();
};

// Enable virtuals in JSON
deviceSchema.set('toJSON', { virtuals: true });
deviceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Device', deviceSchema);

