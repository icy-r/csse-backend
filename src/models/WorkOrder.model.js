const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  workOrderId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'WO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartBin',
    required: [true, 'Bin ID is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'resolved', 'escalated', 'cancelled'],
    default: 'pending'
  },
  issueDescription: {
    type: String,
    required: [true, 'Issue description is required']
  },
  issueType: {
    type: String,
    enum: ['offline', 'battery-low', 'sensor-error', 'physical-damage', 'other'],
    default: 'other'
  },
  actionTaken: {
    type: String,
    enum: ['repaired', 'replaced', 'none'],
    default: 'none'
  },
  resolutionNotes: String,
  newDeviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  assignedDate: Date,
  resolvedDate: Date,
  estimatedResolutionTime: Number, // minutes
  actualResolutionTime: Number // minutes
}, {
  timestamps: true
});

// Indexes for efficient queries
workOrderSchema.index({ technicianId: 1, status: 1 });
// Indexes (workOrderId already indexed via unique: true)
workOrderSchema.index({ status: 1, priority: 1 });
workOrderSchema.index({ deviceId: 1 });
workOrderSchema.index({ binId: 1 });

// Virtual for days since creation
workOrderSchema.virtual('daysSinceCreated').get(function() {
  const today = new Date();
  const diff = today - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for resolution time
workOrderSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedDate) return null;
  const diff = this.resolvedDate - this.createdAt;
  return Math.round(diff / (1000 * 60)); // minutes
});

// Method to assign to technician
workOrderSchema.methods.assignToTechnician = function(technicianId) {
  this.technicianId = technicianId;
  this.status = 'assigned';
  this.assignedDate = new Date();
  return this.save();
};

// Method to start work
workOrderSchema.methods.startWork = function() {
  this.status = 'in-progress';
  return this.save();
};

// Method to resolve
workOrderSchema.methods.resolve = function(actionTaken, resolutionNotes, newDeviceId = null) {
  this.status = 'resolved';
  this.actionTaken = actionTaken;
  this.resolutionNotes = resolutionNotes;
  this.resolvedDate = new Date();
  
  if (newDeviceId) {
    this.newDeviceId = newDeviceId;
  }
  
  // Calculate actual resolution time
  if (this.assignedDate) {
    this.actualResolutionTime = Math.round((this.resolvedDate - this.assignedDate) / (1000 * 60));
  } else {
    this.actualResolutionTime = Math.round((this.resolvedDate - this.createdAt) / (1000 * 60));
  }
  
  return this.save();
};

// Method to escalate
workOrderSchema.methods.escalate = function(reason) {
  this.status = 'escalated';
  this.resolutionNotes = reason;
  return this.save();
};

// Method to cancel
workOrderSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.resolutionNotes = reason;
  return this.save();
};

// Enable virtuals in JSON
workOrderSchema.set('toJSON', { virtuals: true });
workOrderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('WorkOrder', workOrderSchema);

