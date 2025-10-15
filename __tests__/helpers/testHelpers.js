/**
 * Test Helper Functions
 * Provides utilities for creating test data and mocking
 */

const mongoose = require('mongoose');

/**
 * Create a mock request object
 */
exports.mockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    method: options.method || 'GET',
    path: options.path || '/',
    ip: options.ip || '127.0.0.1',
    dbQuery: options.dbQuery || {},
    dbOptions: options.dbOptions || {
      page: 1,
      limit: 20,
      sort: {},
      select: ''
    }
  };
};

/**
 * Create a mock response object
 */
exports.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create test user data
 */
exports.createTestUser = (overrides = {}) => {
  return {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    phone: '+94771234567',
    role: 'citizen',
    status: 'active',
    address: {
      street: '123 Test Street',
      city: 'Colombo',
      postalCode: '10100',
      coordinates: {
        lat: 6.9271,
        lng: 79.8612
      }
    },
    ...overrides
  };
};

/**
 * Create test waste request data
 */
exports.createTestWasteRequest = (userId, overrides = {}) => {
  return {
    userId: userId || new mongoose.Types.ObjectId(),
    wasteType: 'household',
    quantity: '2 bags',
    address: {
      street: '123 Test Street',
      city: 'Colombo',
      postalCode: '10100',
      coordinates: {
        lat: 6.9271,
        lng: 79.8612
      }
    },
    preferredDate: new Date(Date.now() + 86400000), // Tomorrow
    description: 'Test waste pickup',
    status: 'pending',
    ...overrides
  };
};

/**
 * Create test smart bin data
 */
exports.createTestSmartBin = (overrides = {}) => {
  return {
    binId: `BIN-${Date.now()}`,
    location: {
      address: '123 Test Street, Colombo',
      area: 'Colombo 01',
      coordinates: {
        lat: 6.9271,
        lng: 79.8612
      }
    },
    fillLevel: 50,
    capacity: 240,
    binType: 'general',
    status: 'active',
    ...overrides
  };
};

/**
 * Create test route data
 */
exports.createTestRoute = (coordinatorId, overrides = {}) => {
  return {
    routeName: 'Test Route 01',
    coordinatorId: coordinatorId || new mongoose.Types.ObjectId(),
    stops: [],
    status: 'draft',
    scheduledDate: new Date(Date.now() + 86400000),
    totalDistance: 0,
    estimatedDuration: 0,
    ...overrides
  };
};

/**
 * Create test work order data
 */
exports.createTestWorkOrder = (deviceId, binId, overrides = {}) => {
  return {
    deviceId: deviceId || new mongoose.Types.ObjectId(),
    binId: binId || new mongoose.Types.ObjectId(),
    issueDescription: 'Test device malfunction',
    priority: 'medium',
    status: 'pending',
    ...overrides
  };
};

/**
 * Create test device data
 */
exports.createTestDevice = (overrides = {}) => {
  return {
    deviceId: `DEV-${Date.now()}`,
    deviceType: 'sensor',
    status: 'active',
    batteryLevel: 85,
    installationDate: new Date(),
    ...overrides
  };
};

/**
 * Wait for a promise to resolve
 */
exports.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate random coordinates within range
 */
exports.randomCoordinates = (centerLat = 6.9271, centerLng = 79.8612, radiusKm = 5) => {
  const r = radiusKm / 111.3;
  const y0 = centerLat;
  const x0 = centerLng;
  const u = Math.random();
  const v = Math.random();
  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    lat: y + y0,
    lng: x + x0
  };
};

