const mongoose = require('mongoose');

const crewProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true
    },
    vehicleId: {
      type: String,
      trim: true
    },
    availability: {
      type: String,
      enum: ['available', 'assigned', 'unavailable', 'on-leave'],
      default: 'available'
    },
    currentRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route'
    },
    performanceMetrics: {
      totalRoutesCompleted: {
        type: Number,
        default: 0
      },
      totalStopsCompleted: {
        type: Number,
        default: 0
      },
      averageCompletionTime: {
        type: Number, // minutes
        default: 0
      },
      onTimeCompletionRate: {
        type: Number, // percentage
        default: 0
      }
    },
    certifications: [
      {
        name: String,
        issueDate: Date,
        expiryDate: Date
      }
    ],
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    notes: String,
    lastActiveDate: Date
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
crewProfileSchema.index({ userId: 1 });
crewProfileSchema.index({ availability: 1 });
crewProfileSchema.index({ currentRouteId: 1 });

// Method to check if crew is available
crewProfileSchema.methods.isAvailable = function () {
  return this.availability === 'available';
};

// Method to assign to route
crewProfileSchema.methods.assignToRoute = function (routeId) {
  this.currentRouteId = routeId;
  this.availability = 'assigned';
  this.lastActiveDate = new Date();
  return this.save();
};

// Method to complete route
crewProfileSchema.methods.completeRoute = function () {
  this.currentRouteId = null;
  this.availability = 'available';
  this.performanceMetrics.totalRoutesCompleted += 1;
  this.lastActiveDate = new Date();
  return this.save();
};

// Method to update availability
crewProfileSchema.methods.updateAvailability = function (status) {
  this.availability = status;
  if (status === 'unavailable' || status === 'on-leave') {
    this.currentRouteId = null;
  }
  return this.save();
};

module.exports = mongoose.model('CrewProfile', crewProfileSchema);

