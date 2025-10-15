const mongoose = require('mongoose');

const wasteRequestSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'WR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  wasteType: {
    type: String,
    enum: ['household', 'bulky', 'e-waste', 'recyclable'],
    required: [true, 'Waste type is required']
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required']
  },
  address: {
    street: { 
      type: String, 
      required: [true, 'Street address is required']
    },
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required']
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: Number,
  paymentStatus: {
    type: String,
    enum: ['not-required', 'pending', 'paid', 'failed'],
    default: 'not-required'
  },
  scheduledDate: Date,
  completedDate: Date,
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  rejectionReason: String,
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient queries (trackingId already indexed via unique: true)
wasteRequestSchema.index({ userId: 1, status: 1 });
wasteRequestSchema.index({ status: 1, preferredDate: 1 });
wasteRequestSchema.index({ createdAt: -1 });
wasteRequestSchema.index({ routeId: 1 });

// Virtual for days until preferred date
wasteRequestSchema.virtual('daysUntilPreferred').get(function() {
  if (!this.preferredDate) return null;
  const today = new Date();
  const diff = this.preferredDate - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to approve request
wasteRequestSchema.methods.approve = function() {
  this.status = 'approved';
  return this.save();
};

// Method to reject request
wasteRequestSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  return this.save();
};

// Method to schedule request
wasteRequestSchema.methods.schedule = function(date, routeId) {
  this.status = 'scheduled';
  this.scheduledDate = date;
  if (routeId) this.routeId = routeId;
  return this.save();
};

// Method to complete request
wasteRequestSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedDate = new Date();
  return this.save();
};

module.exports = mongoose.model('WasteRequest', wasteRequestSchema);

