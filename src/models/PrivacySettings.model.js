const mongoose = require('mongoose');

const privacySettingsSchema = new mongoose.Schema(
  {
    // Singleton pattern - only one document should exist
    _id: {
      type: String,
      default: 'privacy-settings'
    },
    dataEncryption: {
      enabled: {
        type: Boolean,
        default: true
      },
      algorithm: {
        type: String,
        default: 'AES-256-GCM'
      }
    },
    dataRetention: {
      days: {
        type: Number,
        default: 730, // 2 years
        min: 30,
        max: 3650 // 10 years
      },
      autoDelete: {
        type: Boolean,
        default: false
      }
    },
    anonymization: {
      enabled: {
        type: Boolean,
        default: true
      },
      rules: {
        reports: {
          type: Boolean,
          default: true,
          description: 'Anonymize personal data in reports'
        },
        exports: {
          type: Boolean,
          default: true,
          description: 'Anonymize personal data in exports'
        },
        publicData: {
          type: Boolean,
          default: true,
          description: 'Anonymize data shared publicly'
        }
      }
    },
    auditLogging: {
      level: {
        type: String,
        enum: ['off', 'basic', 'detailed', 'verbose'],
        default: 'detailed'
      },
      retention: {
        type: Number,
        default: 365, // days
        min: 30
      },
      loggedEvents: {
        authentication: {
          type: Boolean,
          default: true
        },
        dataAccess: {
          type: Boolean,
          default: true
        },
        dataModification: {
          type: Boolean,
          default: true
        },
        adminActions: {
          type: Boolean,
          default: true
        }
      }
    },
    dataCollection: {
      location: {
        type: Boolean,
        default: true,
        description: 'Collect location data'
      },
      usage: {
        type: Boolean,
        default: true,
        description: 'Collect usage analytics'
      },
      diagnostics: {
        type: Boolean,
        default: true,
        description: 'Collect diagnostic data'
      }
    },
    cookies: {
      essential: {
        type: Boolean,
        default: true,
        description: 'Essential cookies for functionality'
      },
      analytics: {
        type: Boolean,
        default: false,
        description: 'Analytics and performance cookies'
      },
      marketing: {
        type: Boolean,
        default: false,
        description: 'Marketing and targeting cookies'
      }
    },
    compliance: {
      gdpr: {
        enabled: {
          type: Boolean,
          default: true
        },
        consentRequired: {
          type: Boolean,
          default: true
        }
      },
      ccpa: {
        enabled: {
          type: Boolean,
          default: false
        }
      }
    },
    lastModified: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      at: {
        type: Date,
        default: Date.now
      },
      changes: [
        {
          field: String,
          oldValue: mongoose.Schema.Types.Mixed,
          newValue: mongoose.Schema.Types.Mixed,
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  },
  {
    timestamps: true,
    _id: false // Prevent auto-generation of _id
  }
);

// Static method to get or create settings
privacySettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('privacy-settings');
  if (!settings) {
    settings = await this.create({ _id: 'privacy-settings' });
  }
  return settings;
};

// Method to update settings with audit trail
privacySettingsSchema.methods.updateSettings = function (updates, userId) {
  const changes = [];
  
  Object.keys(updates).forEach(key => {
    if (this[key] !== updates[key]) {
      changes.push({
        field: key,
        oldValue: this[key],
        newValue: updates[key],
        timestamp: new Date()
      });
      this[key] = updates[key];
    }
  });
  
  if (changes.length > 0) {
    this.lastModified = {
      by: userId,
      at: new Date(),
      changes: [...(this.lastModified?.changes || []), ...changes]
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('PrivacySettings', privacySettingsSchema);

