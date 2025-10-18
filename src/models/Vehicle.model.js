const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['truck', 'van', 'compactor', 'pickup'],
      required: [true, 'Vehicle type is required'],
    },
    capacity: {
      type: Number, // in cubic meters or liters
      required: [true, 'Capacity is required'],
    },
    status: {
      type: String,
      enum: ['available', 'in-use', 'maintenance', 'decommissioned'],
      default: 'available',
    },
    assignedCrewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    currentRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    manufacturer: String,
    model: String,
    year: Number,
    mileage: {
      type: Number,
      default: 0,
    },
    fuelType: {
      type: String,
      enum: ['diesel', 'petrol', 'electric', 'hybrid'],
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        type: String, // 'routine', 'repair', 'inspection'
        description: String,
        cost: Number,
        technicianName: String,
        mileageAtService: Number,
      },
    ],
    insuranceExpiryDate: Date,
    registrationExpiryDate: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ assignedCrewId: 1 });

// Virtual: Check if maintenance is due
vehicleSchema.virtual('maintenanceDue').get(function () {
  if (!this.nextMaintenanceDate) return false;
  return new Date() >= this.nextMaintenanceDate;
});

// Virtual: Days until next maintenance
vehicleSchema.virtual('daysUntilMaintenance').get(function () {
  if (!this.nextMaintenanceDate) return null;
  const today = new Date();
  const diffTime = this.nextMaintenanceDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method: Assign vehicle to crew
vehicleSchema.methods.assignToCrew = async function (crewId, routeId) {
  this.assignedCrewId = crewId;
  this.currentRouteId = routeId;
  this.status = 'in-use';
  return this.save();
};

// Method: Release vehicle from assignment
vehicleSchema.methods.release = async function () {
  this.assignedCrewId = null;
  this.currentRouteId = null;
  this.status = 'available';
  return this.save();
};

// Method: Add maintenance record
vehicleSchema.methods.addMaintenanceRecord = function (record) {
  this.maintenanceHistory.push(record);
  this.lastMaintenanceDate = record.date;
  if (record.mileageAtService) {
    this.mileage = record.mileageAtService;
  }
  return this.save();
};

// Ensure virtuals are included in JSON
vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);

