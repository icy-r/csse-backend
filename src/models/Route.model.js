const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    routeName: {
      type: String,
      required: [true, "Route name is required"],
    },
    coordinatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for draft routes
    },
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    vehicleId: String,
    stops: [
      {
        stopType: {
          type: String,
          enum: ["bin", "request"],
          required: true,
        },
        referenceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: "stops.stopType",
        },
        sequence: Number,
        address: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "skipped"],
          default: "pending",
        },
        completedAt: Date,
        notes: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "assigned", "in-progress", "completed", "cancelled"],
      default: "draft",
    },
    scheduledDate: Date,
    startTime: Date,
    endTime: Date,
    totalDistance: Number, // km
    estimatedDuration: Number, // minutes
    actualDuration: Number, // minutes
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
routeSchema.index({ coordinatorId: 1, status: 1 });
routeSchema.index({ crewId: 1, status: 1 });
routeSchema.index({ scheduledDate: 1 });
routeSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for route duration
routeSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  return Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
});

// Virtual for completed stops count
routeSchema.virtual("completedStopsCount").get(function () {
  return (this.stops || []).filter((s) => s.status === "completed").length;
});

// Virtual for total stops count
routeSchema.virtual("totalStopsCount").get(function () {
  return (this.stops || []).length;
});

// Calculate completion percentage
routeSchema.methods.updateCompletion = function () {
  const totalStops = (this.stops || []).length;
  const completedStops = (this.stops || []).filter(
    (s) => s.status === "completed"
  ).length;
  this.completionPercentage =
    totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  // Auto-update status if all stops completed
  if (this.completionPercentage === 100 && this.status === "in-progress") {
    this.status = "completed";
    this.endTime = new Date();

    // Calculate actual duration
    if (this.startTime) {
      this.actualDuration = Math.round(
        (this.endTime - this.startTime) / (1000 * 60)
      );
    }
  }

  return this;
};

// Method to start route
routeSchema.methods.startRoute = function () {
  this.status = "in-progress";
  this.startTime = new Date();
  return this.save();
};

// Method to complete route
routeSchema.methods.completeRoute = function () {
  this.status = "completed";
  this.endTime = new Date();
  this.completionPercentage = 100;

  if (this.startTime) {
    this.actualDuration = Math.round(
      (this.endTime - this.startTime) / (1000 * 60)
    );
  }

  return this.save();
};

// Method to assign to crew
routeSchema.methods.assignToCrew = function (crewId, vehicleId) {
  this.crewId = crewId;
  if (vehicleId) this.vehicleId = vehicleId;
  this.status = "assigned";
  return this.save();
};

// Method to update stop status
routeSchema.methods.updateStopStatus = function (stopIndex, status) {
  if (this.stops && stopIndex >= 0 && stopIndex < this.stops.length) {
    this.stops[stopIndex].status = status;
    if (status === "completed") {
      this.stops[stopIndex].completedAt = new Date();
    }
    this.updateCompletion();
  }
  return this;
};

// Enable virtuals in JSON
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);

