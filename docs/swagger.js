const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Waste Management API',
    version: '1.0.0',
    description: 'RESTful API for Smart Waste Management System - MVP Backend',
    contact: {
      name: 'Development Team',
      email: 'support@wastemanagement.com'
    },
    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.csse.icy-r.dev',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Citizen',
      description: 'Resident/Citizen operations - Request waste pickup, track requests, find nearby bins'
    },
    {
      name: 'Coordinator',
      description: 'Collection Coordinator operations - Route management, bin monitoring, request approval'
    },
    {
      name: 'Technician',
      description: 'Field Technician operations - Device maintenance, work orders, repairs'
    },
    {
      name: 'Admin',
      description: 'System Administrator operations - User management, reports, system health'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '507f1f77bcf86cd799439011'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com'
          },
          phone: {
            type: 'string',
            example: '+94771234567'
          },
          role: {
            type: 'string',
            enum: ['citizen', 'coordinator', 'technician', 'admin'],
            example: 'citizen'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended'],
            example: 'active'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              postalCode: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              }
            }
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      WasteRequest: {
        type: 'object',
        properties: {
          _id: {
            type: 'string'
          },
          trackingId: {
            type: 'string',
            example: 'WR-1697123456-ABC12'
          },
          userId: {
            type: 'string'
          },
          wasteType: {
            type: 'string',
            enum: ['household', 'bulky', 'e-waste', 'recyclable'],
            example: 'household'
          },
          quantity: {
            type: 'string',
            example: '2 bags'
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string', example: '123 Main St, Malabe' },
              city: { type: 'string', example: 'Colombo' },
              postalCode: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number', example: 6.9271 },
                  lng: { type: 'number', example: 79.8612 }
                }
              }
            }
          },
          preferredDate: {
            type: 'string',
            format: 'date'
          },
          status: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'scheduled', 'in-progress', 'completed', 'cancelled'],
            example: 'pending'
          },
          estimatedCost: {
            type: 'number',
            example: 0
          },
          paymentStatus: {
            type: 'string',
            enum: ['not-required', 'pending', 'paid', 'failed'],
            example: 'not-required'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      SmartBin: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          binId: {
            type: 'string',
            example: 'BIN-001'
          },
          location: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              area: { type: 'string' },
              coordinates: {
                type: 'object',
                properties: {
                  lat: { type: 'number' },
                  lng: { type: 'number' }
                }
              }
            }
          },
          fillLevel: {
            type: 'number',
            minimum: 0,
            maximum: 100,
            example: 75
          },
          capacity: {
            type: 'number',
            example: 240
          },
          binType: {
            type: 'string',
            enum: ['household', 'recyclable', 'organic', 'general'],
            example: 'general'
          },
          status: {
            type: 'string',
            enum: ['active', 'offline', 'maintenance', 'full'],
            example: 'active'
          },
          fillStatusColor: {
            type: 'string',
            enum: ['red', 'yellow', 'green'],
            example: 'yellow'
          }
        }
      },
      Route: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          routeName: {
            type: 'string',
            example: 'Route A - Morning Collection'
          },
          coordinatorId: { type: 'string' },
          crewId: { type: 'string' },
          vehicleId: { type: 'string' },
          stops: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                stopType: {
                  type: 'string',
                  enum: ['bin', 'request']
                },
                referenceId: { type: 'string' },
                sequence: { type: 'number' },
                address: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['pending', 'completed', 'skipped']
                }
              }
            }
          },
          status: {
            type: 'string',
            enum: ['draft', 'assigned', 'in-progress', 'completed', 'cancelled']
          },
          totalDistance: { type: 'number', example: 15.5 },
          estimatedDuration: { type: 'number', example: 120 },
          completionPercentage: { type: 'number', example: 65 }
        }
      },
      WorkOrder: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          workOrderId: {
            type: 'string',
            example: 'WO-1697123456-XYZ89'
          },
          technicianId: { type: 'string' },
          deviceId: { type: 'string' },
          binId: { type: 'string' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            example: 'high'
          },
          status: {
            type: 'string',
            enum: ['pending', 'assigned', 'in-progress', 'resolved', 'escalated', 'cancelled']
          },
          issueDescription: {
            type: 'string',
            example: 'Device offline for 4 hours'
          },
          actionTaken: {
            type: 'string',
            enum: ['repaired', 'replaced', 'none']
          }
        }
      },
      Device: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          deviceId: {
            type: 'string',
            example: 'DEV-RFID-001'
          },
          deviceType: {
            type: 'string',
            enum: ['rfid', 'qr-code', 'sensor']
          },
          binId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['active', 'offline', 'decommissioned']
          },
          batteryLevel: {
            type: 'number',
            minimum: 0,
            maximum: 100
          },
          lastSignal: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          data: {
            type: 'object'
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
              hasNextPage: { type: 'boolean' },
              hasPrevPage: { type: 'boolean' }
            }
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          errors: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      }
    },
    parameters: {
      PageParam: {
        in: 'query',
        name: 'page',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1
        },
        description: 'Page number for pagination'
      },
      LimitParam: {
        in: 'query',
        name: 'limit',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20
        },
        description: 'Number of items per page'
      },
      SortParam: {
        in: 'query',
        name: 'sort',
        schema: {
          type: 'string',
          example: 'createdAt:desc'
        },
        description: 'Sort by field:order (asc/desc). Multiple: field1:asc,field2:desc'
      },
      SelectParam: {
        in: 'query',
        name: 'select',
        schema: {
          type: 'string',
          example: 'name,email,status'
        },
        description: 'Comma-separated list of fields to include'
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js'] // Path to route files for annotations
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

