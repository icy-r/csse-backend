const mongoose = require('mongoose');

const smartBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: [true, 'Bin ID is required'],
    unique: true
  },
  location: {
    address: String,
    area: String,
    coordinates: {
      lat: { 
        type: Number, 
        required: [true, 'Latitude is required']
      },
      lng: { 
        type: Number, 
        required: [true, 'Longitude is required']
      }
    }
  },
  fillLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  capacity: {
    type: Number,
    required: true,
    default: 240 // liters
  },
  binType: {
    type: String,
    enum: ['household', 'recyclable', 'organic', 'general'],
    default: 'general'
  },
  status: {
    type: String,
    enum: ['active', 'offline', 'maintenance', 'full'],
    default: 'active'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  lastEmptied: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  collectionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
smartBinSchema.index({ 'location.coordinates': '2dsphere' });

// Indexes for efficient queries
smartBinSchema.index({ status: 1, fillLevel: -1 });
smartBinSchema.index({ binType: 1, status: 1 });
smartBinSchema.index({ fillLevel: -1 });

// Virtual: Get fill status color
smartBinSchema.virtual('fillStatusColor').get(function() {
  if (this.fillLevel >= 90) return 'red';
  if (this.fillLevel >= 70) return 'yellow';
  return 'green';
});

// Virtual: Get fill status label
smartBinSchema.virtual('fillStatusLabel').get(function() {
  if (this.fillLevel >= 90) return 'Full';
  if (this.fillLevel >= 70) return 'Filling';
  return 'Available';
});

// Virtual: Check if needs collection
smartBinSchema.virtual('needsCollection').get(function() {
  return this.fillLevel >= 70;
});

// Virtual: Check if urgent
smartBinSchema.virtual('isUrgent').get(function() {
  return this.fillLevel >= 90;
});

// Method to update fill level
smartBinSchema.methods.updateFillLevel = function(level) {
  this.fillLevel = Math.max(0, Math.min(100, level));
  this.lastUpdated = new Date();
  
  // Auto-update status based on fill level
  if (this.fillLevel >= 90) {
    this.status = 'full';
  } else if (this.status === 'full' && this.fillLevel < 90) {
    this.status = 'active';
  }
  
  return this.save();
};

// Method to empty bin
smartBinSchema.methods.empty = function() {
  this.fillLevel = 0;
  this.lastEmptied = new Date();
  this.lastUpdated = new Date();
  this.collectionCount += 1;
  if (this.status === 'full') {
    this.status = 'active';
  }
  return this.save();
};

// Method to set maintenance mode
smartBinSchema.methods.setMaintenance = function(isMaintenance) {
  this.status = isMaintenance ? 'maintenance' : 'active';
  return this.save();
};

// Enable virtuals in JSON
smartBinSchema.set('toJSON', { virtuals: true });
smartBinSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SmartBin', smartBinSchema);

