const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const issueSchema = new mongoose.Schema(
  {
    issueId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values during creation, unique constraint applies only to non-null values
    },
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Route",
      default: null,
    },
    issueType: {
      type: String,
      required: true,
      enum: [
        "blocked-access",
        "bin-damaged",
        "bin-overflow",
        "safety-hazard",
        "vehicle-issue",
        "other",
      ],
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    location: {
      type: String,
      maxlength: 200,
    },
    stopIndex: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["reported", "acknowledged", "in-progress", "resolved", "closed"],
      default: "reported",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolution: {
      type: String,
      maxlength: 500,
      default: null,
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

// Generate unique issue ID before saving
issueSchema.pre('save', async function(next) {
  if (this.isNew && !this.issueId) {
    const count = await mongoose.model('Issue').countDocuments();
    this.issueId = `ISS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Method to acknowledge issue
issueSchema.methods.acknowledge = function() {
  this.status = 'acknowledged';
  this.acknowledgedAt = new Date();
  return this.save();
};

// Method to resolve issue
issueSchema.methods.resolve = function(resolvedBy, resolution) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolution = resolution;
  return this.save();
};

// Method to close issue
issueSchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Method to add comment
issueSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    userId,
    comment
  });
  return this.save();
};

// Method to update priority
issueSchema.methods.updatePriority = function(priority) {
  this.priority = priority;
  return this.save();
};

// Indexes for performance
issueSchema.index({ crewId: 1, reportedAt: -1 });
issueSchema.index({ status: 1, priority: -1 });
issueSchema.index({ routeId: 1 });
issueSchema.index({ issueType: 1 });

// Enable virtuals in JSON
issueSchema.set('toJSON', { virtuals: true });
issueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Issue', issueSchema);

