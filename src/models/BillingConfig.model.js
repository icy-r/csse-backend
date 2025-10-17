const mongoose = require('mongoose');

const billingConfigSchema = new mongoose.Schema(
  {
    // Singleton pattern - only one document should exist
    _id: {
      type: String,
      default: 'billing-config'
    },
    wasteTypeRates: {
      household: {
        baseFee: {
          type: Number,
          default: 0,
          description: 'Base fee in LKR'
        },
        perKg: {
          type: Number,
          default: 0
        },
        perBag: {
          type: Number,
          default: 0
        }
      },
      bulky: {
        baseFee: {
          type: Number,
          default: 500
        },
        perItem: {
          type: Number,
          default: 500
        },
        minimumCharge: {
          type: Number,
          default: 500
        }
      },
      'e-waste': {
        baseFee: {
          type: Number,
          default: 0
        },
        perKg: {
          type: Number,
          default: 0
        },
        perItem: {
          type: Number,
          default: 0
        }
      },
      recyclable: {
        baseFee: {
          type: Number,
          default: 0
        },
        perKg: {
          type: Number,
          default: 0
        },
        incentive: {
          type: Number,
          default: 0,
          description: 'Incentive paid per kg for recycling'
        }
      }
    },
    taxConfiguration: {
      enabled: {
        type: Boolean,
        default: false
      },
      vatRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'VAT rate in percentage'
      },
      serviceTax: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        description: 'Service tax in percentage'
      }
    },
    paymentGateway: {
      provider: {
        type: String,
        enum: ['stripe', 'paypal', 'payhere', 'manual', 'none'],
        default: 'none'
      },
      apiKey: {
        type: String,
        select: false // Don't include in normal queries
      },
      secretKey: {
        type: String,
        select: false
      },
      webhookSecret: {
        type: String,
        select: false
      },
      testMode: {
        type: Boolean,
        default: true
      },
      currency: {
        type: String,
        default: 'LKR'
      }
    },
    paymentMethods: {
      cash: {
        enabled: {
          type: Boolean,
          default: true
        }
      },
      card: {
        enabled: {
          type: Boolean,
          default: false
        }
      },
      bankTransfer: {
        enabled: {
          type: Boolean,
          default: false
        },
        accountDetails: {
          bankName: String,
          accountNumber: String,
          accountName: String,
          branch: String
        }
      },
      digitalWallet: {
        enabled: {
          type: Boolean,
          default: false
        },
        providers: [String]
      }
    },
    billing: {
      minimumCharge: {
        type: Number,
        default: 0,
        description: 'Minimum charge for any service in LKR'
      },
      maximumCharge: {
        type: Number,
        default: 50000,
        description: 'Maximum charge for any service in LKR'
      },
      lateFeePercentage: {
        type: Number,
        default: 5,
        min: 0,
        max: 50,
        description: 'Late payment fee percentage'
      },
      paymentDueDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 90,
        description: 'Days to make payment after service'
      },
      invoicePrefix: {
        type: String,
        default: 'INV',
        description: 'Prefix for invoice numbers'
      },
      invoiceSequence: {
        type: Number,
        default: 1,
        description: 'Current invoice sequence number'
      }
    },
    discounts: {
      bulkDiscount: {
        enabled: {
          type: Boolean,
          default: false
        },
        threshold: {
          type: Number,
          default: 5,
          description: 'Number of collections per month to qualify'
        },
        percentage: {
          type: Number,
          default: 10,
          min: 0,
          max: 100
        }
      },
      earlyPayment: {
        enabled: {
          type: Boolean,
          default: false
        },
        daysBeforeDue: {
          type: Number,
          default: 3
        },
        percentage: {
          type: Number,
          default: 5,
          min: 0,
          max: 100
        }
      }
    },
    reporting: {
      autoGenerateInvoices: {
        type: Boolean,
        default: true
      },
      sendPaymentReminders: {
        type: Boolean,
        default: true
      },
      reminderDaysBeforeDue: {
        type: Number,
        default: 2
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
    _id: false
  }
);

// Static method to get or create billing config
billingConfigSchema.statics.getConfig = async function () {
  let config = await this.findById('billing-config');
  if (!config) {
    config = await this.create({ _id: 'billing-config' });
  }
  return config;
};

// Method to calculate cost for a waste request
billingConfigSchema.methods.calculateCost = function (wasteType, quantity, weight = 0) {
  const rates = this.wasteTypeRates[wasteType];
  if (!rates) return 0;
  
  let cost = rates.baseFee || 0;
  
  // Parse quantity to extract numbers
  const quantityNum = parseInt(quantity) || 1;
  
  if (rates.perItem) {
    cost += rates.perItem * quantityNum;
  }
  
  if (rates.perKg && weight > 0) {
    cost += rates.perKg * weight;
  }
  
  if (rates.perBag) {
    cost += rates.perBag * quantityNum;
  }
  
  // Apply minimum charge
  if (rates.minimumCharge && cost < rates.minimumCharge) {
    cost = rates.minimumCharge;
  }
  
  // Apply overall minimum and maximum
  if (cost < this.billing.minimumCharge) {
    cost = this.billing.minimumCharge;
  }
  
  if (cost > this.billing.maximumCharge) {
    cost = this.billing.maximumCharge;
  }
  
  // Apply taxes if enabled
  if (this.taxConfiguration.enabled) {
    const vatAmount = cost * (this.taxConfiguration.vatRate / 100);
    const serviceTaxAmount = cost * (this.taxConfiguration.serviceTax / 100);
    cost += vatAmount + serviceTaxAmount;
  }
  
  return Math.round(cost);
};

// Method to generate next invoice number
billingConfigSchema.methods.getNextInvoiceNumber = function () {
  const invoiceNumber = `${this.billing.invoicePrefix}-${String(this.billing.invoiceSequence).padStart(6, '0')}`;
  this.billing.invoiceSequence += 1;
  return invoiceNumber;
};

// Method to update config with audit trail
billingConfigSchema.methods.updateConfig = function (updates, userId) {
  const changes = [];
  
  const flattenObject = (obj, prefix = '') => {
    const flattened = {};
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], fullKey));
      } else {
        flattened[fullKey] = obj[key];
      }
    });
    return flattened;
  };
  
  const flatUpdates = flattenObject(updates);
  const flatCurrent = flattenObject(this.toObject());
  
  Object.keys(flatUpdates).forEach(key => {
    if (flatCurrent[key] !== flatUpdates[key]) {
      changes.push({
        field: key,
        oldValue: flatCurrent[key],
        newValue: flatUpdates[key],
        timestamp: new Date()
      });
    }
  });
  
  // Apply updates
  Object.assign(this, updates);
  
  if (changes.length > 0) {
    this.lastModified = {
      by: userId,
      at: new Date(),
      changes: [...(this.lastModified?.changes || []), ...changes]
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('BillingConfig', billingConfigSchema);

