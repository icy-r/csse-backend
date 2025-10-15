const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  role: {
    type: String,
    enum: ['citizen', 'coordinator', 'technician', 'admin'],
    required: [true, 'Role is required'],
    default: 'citizen'
  },
  address: {
    street: String,
    city: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Indexes (email already indexed via unique: true)
userSchema.index({ role: 1, status: 1 });
userSchema.index({ status: 1 });

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email;
});

// Method to check if user is active
userSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

