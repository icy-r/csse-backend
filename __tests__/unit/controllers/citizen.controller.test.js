/**
 * Citizen Controller Unit Tests
 * Tests for all citizen endpoints with positive, negative, and edge cases
 */

const citizenController = require('../../../src/controllers/citizen.controller');
const WasteRequest = require('../../../src/models/WasteRequest.model');
const SmartBin = require('../../../src/models/SmartBin.model');
const User = require('../../../src/models/User.model');
const { mockRequest, mockResponse, createTestUser, createTestWasteRequest, createTestSmartBin } = require('../../helpers/testHelpers');

// Mock notification service
jest.mock('../../../src/services/notification.service', () => ({
  sendNotification: jest.fn().mockResolvedValue({ success: true })
}));

describe('Citizen Controller', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create(createTestUser());
  });

  describe('createRequest', () => {
    test('should create a new waste request successfully', async () => {
      const req = mockRequest({
        body: {
          userId: testUser._id.toString(),
          wasteType: 'household',
          quantity: '2 bags',
          address: {
            street: '123 Test Street',
            city: 'Colombo',
            postalCode: '10100',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          preferredDate: new Date(Date.now() + 86400000).toISOString(),
          description: 'Household waste pickup'
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.trackingId).toBeDefined();
      expect(response.data.status).toBe('pending');
    });

    test('should fail without required fields', async () => {
      const req = mockRequest({
        body: {
          userId: testUser._id.toString()
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain('Missing required fields');
    });

    test('should limit to 3 active requests per user', async () => {
      // Create 3 pending requests
      for (let i = 0; i < 3; i++) {
        await WasteRequest.create(createTestWasteRequest(testUser._id));
      }

      const req = mockRequest({
        body: {
          userId: testUser._id.toString(),
          wasteType: 'household',
          quantity: '1 bag',
          address: {
            street: '123 Test Street',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          preferredDate: new Date(Date.now() + 86400000).toISOString()
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('maximum limit of 3 active waste requests');
    });

    test('should calculate cost for bulky waste', async () => {
      const req = mockRequest({
        body: {
          userId: testUser._id.toString(),
          wasteType: 'bulky',
          quantity: '2 items',
          address: {
            street: '123 Test Street',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          preferredDate: new Date(Date.now() + 86400000).toISOString()
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.data.estimatedCost).toBeGreaterThan(0);
      expect(response.data.paymentRequired).toBe(true);
    });

    test('should set no cost for household waste', async () => {
      const req = mockRequest({
        body: {
          userId: testUser._id.toString(),
          wasteType: 'household',
          quantity: '3 bags',
          address: {
            street: '123 Test Street',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          preferredDate: new Date(Date.now() + 86400000).toISOString()
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.data.estimatedCost).toBe(0);
      expect(response.data.paymentRequired).toBe(false);
    });
  });

  describe('getRequests', () => {
    test('should get user requests with pagination', async () => {
      // Create test requests
      await WasteRequest.create(createTestWasteRequest(testUser._id));
      await WasteRequest.create(createTestWasteRequest(testUser._id));

      const req = mockRequest({
        query: { userId: testUser._id.toString() },
        dbQuery: { userId: testUser._id.toString() },
        dbOptions: {
          page: 1,
          limit: 10,
          sort: { createdAt: -1 },
          select: ''
        }
      });
      const res = mockResponse();

      await citizenController.getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.pagination).toBeDefined();
      expect(response.pagination.total).toBe(2);
    });

    test('should fail without userId', async () => {
      const req = mockRequest({
        query: {},
        dbQuery: {}
      });
      const res = mockResponse();

      await citizenController.getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain('User ID is required');
    });

    test('should filter by status', async () => {
      await WasteRequest.create(createTestWasteRequest(testUser._id, { status: 'pending' }));
      await WasteRequest.create(createTestWasteRequest(testUser._id, { status: 'approved' }));

      const req = mockRequest({
        query: { userId: testUser._id.toString(), status: 'pending' },
        dbQuery: { userId: testUser._id.toString(), status: 'pending' },
        dbOptions: { page: 1, limit: 10, sort: {}, select: '' }
      });
      const res = mockResponse();

      await citizenController.getRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.length).toBe(1);
      expect(response.data[0].status).toBe('pending');
    });
  });

  describe('getRequestById', () => {
    test('should get request details by ID', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.getRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data._id.toString()).toBe(request._id.toString());
    });

    test('should return 404 for non-existent request', async () => {
      const req = mockRequest({
        params: { id: '507f1f77bcf86cd799439011' }
      });
      const res = mockResponse();

      await citizenController.getRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain('Request not found');
    });
  });

  describe('trackRequest', () => {
    test('should return request with timeline', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { status: 'approved' })
      );

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.trackRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.data.timeline).toBeDefined();
      expect(response.data.timeline.length).toBeGreaterThan(0);
      expect(response.data.timeline[0].label).toBe('Request Submitted');
    });

    test('should include rejection in timeline', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { 
          status: 'rejected',
          rejectionReason: 'Invalid waste type'
        })
      );

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.trackRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      const rejectedStep = response.data.timeline.find(step => step.status === 'rejected');
      expect(rejectedStep).toBeDefined();
      expect(rejectedStep.label).toBe('Request Rejected');
    });
  });

  describe('updatePayment', () => {
    test('should record payment successfully', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, {
          estimatedCost: 500,
          paymentStatus: 'pending'
        })
      );

      const req = mockRequest({
        params: { id: request._id.toString() },
        body: { amount: 500, paymentMethod: 'Credit Card' }
      });
      const res = mockResponse();

      await citizenController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.paymentStatus).toBe('paid');
    });

    test('should fail if payment already completed', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, {
          estimatedCost: 500,
          paymentStatus: 'paid'
        })
      );

      const req = mockRequest({
        params: { id: request._id.toString() },
        body: { amount: 500, paymentMethod: 'Credit Card' }
      });
      const res = mockResponse();

      await citizenController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('Payment already completed');
    });

    test('should fail if amount is less than estimated cost', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, {
          estimatedCost: 500,
          paymentStatus: 'pending'
        })
      );

      const req = mockRequest({
        params: { id: request._id.toString() },
        body: { amount: 200, paymentMethod: 'Credit Card' }
      });
      const res = mockResponse();

      await citizenController.updatePayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('Payment amount must be at least');
    });
  });

  describe('cancelRequest', () => {
    test('should cancel pending request', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { status: 'pending' })
      );

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.cancelRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('cancelled');
    });

    test('should fail to cancel completed request', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { status: 'completed' })
      );

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.cancelRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('cannot be cancelled');
    });

    test('should fail to cancel within 2 hours of scheduled time', async () => {
      const scheduledDate = new Date(Date.now() + 3600000); // 1 hour from now
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, {
          status: 'scheduled',
          scheduledDate
        })
      );

      const req = mockRequest({
        params: { id: request._id.toString() }
      });
      const res = mockResponse();

      await citizenController.cancelRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('2 hours before');
    });
  });

  describe('getNearbyBins', () => {
    test('should find bins within radius', async () => {
      const centerLat = 6.9271;
      const centerLng = 79.8612;

      // Create nearby bin
      await SmartBin.create(createTestSmartBin({
        location: {
          address: 'Near Test Street',
          area: 'Colombo 01',
          coordinates: { lat: 6.9280, lng: 79.8620 }
        }
      }));

      const req = mockRequest({
        query: { lat: centerLat, lng: centerLng, radius: 2000 }
      });
      const res = mockResponse();

      await citizenController.getNearbyBins(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    test('should fail without coordinates', async () => {
      const req = mockRequest({
        query: { radius: 2000 }
      });
      const res = mockResponse();

      await citizenController.getNearbyBins(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toContain('Latitude and longitude required');
    });

    test('should use default radius if not provided', async () => {
      const centerLat = 6.9271;
      const centerLng = 79.8612;

      await SmartBin.create(createTestSmartBin());

      const req = mockRequest({
        query: { lat: centerLat, lng: centerLng }
      });
      const res = mockResponse();

      await citizenController.getNearbyBins(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      jest.spyOn(WasteRequest, 'create').mockRejectedValueOnce(new Error('Database error'));

      const req = mockRequest({
        body: {
          userId: testUser._id.toString(),
          wasteType: 'household',
          quantity: '1 bag',
          address: {
            street: '123 Test Street',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          preferredDate: new Date(Date.now() + 86400000).toISOString()
        }
      });
      const res = mockResponse();

      await citizenController.createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});

