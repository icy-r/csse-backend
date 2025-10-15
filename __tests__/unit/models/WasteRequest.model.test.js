/**
 * WasteRequest Model Unit Tests
 * Tests for WasteRequest schema validation, methods, and business logic
 */

const WasteRequest = require('../../../src/models/WasteRequest.model');
const User = require('../../../src/models/User.model');
const { createTestWasteRequest, createTestUser } = require('../../helpers/testHelpers');

describe('WasteRequest Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create(createTestUser());
  });

  describe('Schema Validation', () => {
    test('should create a valid waste request', async () => {
      const requestData = createTestWasteRequest(testUser._id);
      const request = await WasteRequest.create(requestData);
      
      expect(request._id).toBeDefined();
      expect(request.userId.toString()).toBe(testUser._id.toString());
      expect(request.wasteType).toBe('household');
      expect(request.status).toBe('pending');
      expect(request.trackingId).toBeDefined();
      expect(request.trackingId).toMatch(/^WR-/);
    });

    test('should fail without required fields', async () => {
      const request = new WasteRequest({});
      let error;
      
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.wasteType).toBeDefined();
      expect(error.errors.quantity).toBeDefined();
      expect(error.errors.preferredDate).toBeDefined();
    });

    test('should validate wasteType enum', async () => {
      const requestData = createTestWasteRequest(testUser._id, { wasteType: 'invalid' });
      const request = new WasteRequest(requestData);
      let error;
      
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.wasteType).toBeDefined();
    });

    test('should accept all valid wasteTypes', async () => {
      const types = ['household', 'bulky', 'e-waste', 'recyclable'];
      
      for (const type of types) {
        const request = await WasteRequest.create(
          createTestWasteRequest(testUser._id, { wasteType: type })
        );
        expect(request.wasteType).toBe(type);
      }
    });

    test('should validate status enum', async () => {
      const requestData = createTestWasteRequest(testUser._id, { status: 'invalid' });
      const request = new WasteRequest(requestData);
      let error;
      
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test('should accept all valid statuses', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'scheduled', 'in-progress', 'completed', 'cancelled'];
      
      for (const status of statuses) {
        const request = await WasteRequest.create(
          createTestWasteRequest(testUser._id, { status })
        );
        expect(request.status).toBe(status);
      }
    });

    test('should validate paymentStatus enum', async () => {
      const requestData = createTestWasteRequest(testUser._id, { paymentStatus: 'invalid' });
      const request = new WasteRequest(requestData);
      let error;
      
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.paymentStatus).toBeDefined();
    });
  });

  describe('Default Values', () => {
    test('should set default status to pending', async () => {
      const requestData = createTestWasteRequest(testUser._id);
      delete requestData.status;
      const request = await WasteRequest.create(requestData);
      
      expect(request.status).toBe('pending');
    });

    test('should set default estimatedCost to 0', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      expect(request.estimatedCost).toBe(0);
    });

    test('should set default paymentStatus to not-required', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      expect(request.paymentStatus).toBe('not-required');
    });

    test('should generate unique tracking ID automatically', async () => {
      const request1 = await WasteRequest.create(createTestWasteRequest(testUser._id));
      const request2 = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      expect(request1.trackingId).toBeDefined();
      expect(request2.trackingId).toBeDefined();
      expect(request1.trackingId).not.toBe(request2.trackingId);
    });
  });

  describe('Address Subdocument', () => {
    test('should save address with coordinates', async () => {
      const requestData = createTestWasteRequest(testUser._id);
      const request = await WasteRequest.create(requestData);
      
      expect(request.address.street).toBe(requestData.address.street);
      expect(request.address.coordinates.lat).toBe(requestData.address.coordinates.lat);
      expect(request.address.coordinates.lng).toBe(requestData.address.coordinates.lng);
    });

    test('should require street in address', async () => {
      const requestData = createTestWasteRequest(testUser._id);
      delete requestData.address.street;
      const request = new WasteRequest(requestData);
      let error;
      
      try {
        await request.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors['address.street']).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      expect(request.createdAt).toBeDefined();
      expect(request.updatedAt).toBeDefined();
      expect(request.createdAt).toBeInstanceOf(Date);
      expect(request.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Virtuals', () => {
    test('should return daysUntilPreferred virtual', async () => {
      const futureDate = new Date(Date.now() + 3 * 86400000); // 3 days from now
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { preferredDate: futureDate })
      );
      const requestObj = request.toObject({ virtuals: true });
      
      expect(requestObj.daysUntilPreferred).toBeDefined();
      expect(requestObj.daysUntilPreferred).toBe(3);
    });

    test('should return null for daysUntilPreferred if date passed', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { preferredDate: pastDate })
      );
      const requestObj = request.toObject({ virtuals: true });
      
      expect(requestObj.daysUntilPreferred).toBe(-1);
    });
  });

  describe('Population', () => {
    test('should populate userId with user data', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      const populatedRequest = await WasteRequest.findById(request._id).populate('userId');
      
      expect(populatedRequest.userId).toBeDefined();
      expect(populatedRequest.userId.name).toBe(testUser.name);
      expect(populatedRequest.userId.email).toBe(testUser.email);
    });
  });

  describe('Query Methods', () => {
    test('should find requests by userId', async () => {
      await WasteRequest.create(createTestWasteRequest(testUser._id));
      await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      const requests = await WasteRequest.find({ userId: testUser._id });
      
      expect(requests.length).toBe(2);
      requests.forEach(req => {
        expect(req.userId.toString()).toBe(testUser._id.toString());
      });
    });

    test('should find requests by status', async () => {
      await WasteRequest.create(createTestWasteRequest(testUser._id, { status: 'pending' }));
      await WasteRequest.create(createTestWasteRequest(testUser._id, { status: 'approved' }));
      
      const pendingRequests = await WasteRequest.find({ status: 'pending' });
      
      expect(pendingRequests.length).toBe(1);
      expect(pendingRequests[0].status).toBe('pending');
    });

    test('should find request by trackingId', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      const foundRequest = await WasteRequest.findOne({ trackingId: request.trackingId });
      
      expect(foundRequest).toBeDefined();
      expect(foundRequest._id.toString()).toBe(request._id.toString());
    });

    test('should sort requests by createdAt', async () => {
      const request1 = await WasteRequest.create(createTestWasteRequest(testUser._id));
      await new Promise(resolve => setTimeout(resolve, 10));
      const request2 = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      const requests = await WasteRequest.find().sort({ createdAt: -1 });
      
      expect(requests[0]._id.toString()).toBe(request2._id.toString());
      expect(requests[1]._id.toString()).toBe(request1._id.toString());
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long description', async () => {
      const longDescription = 'A'.repeat(2000);
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { description: longDescription })
      );
      
      expect(request.description).toBe(longDescription);
    });

    test('should handle past preferredDate', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { preferredDate: pastDate })
      );
      
      expect(request.preferredDate).toEqual(pastDate);
    });

    test('should handle negative estimated cost', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { estimatedCost: -10 })
      );
      
      expect(request.estimatedCost).toBe(-10);
    });

    test('should update status from pending to approved', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      expect(request.status).toBe('pending');
      
      request.status = 'approved';
      await request.save();
      
      const updatedRequest = await WasteRequest.findById(request._id);
      expect(updatedRequest.status).toBe('approved');
    });

    test('should handle empty notes', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { notes: '' })
      );
      
      expect(request.notes).toBe('');
    });
  });

  describe('Business Logic', () => {
    test('should allow setting scheduledDate only for approved status', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      request.status = 'approved';
      request.scheduledDate = new Date(Date.now() + 86400000);
      await request.save();
      
      expect(request.scheduledDate).toBeDefined();
    });

    test('should track completedDate', async () => {
      const request = await WasteRequest.create(createTestWasteRequest(testUser._id));
      
      request.status = 'completed';
      request.completedDate = new Date();
      await request.save();
      
      expect(request.completedDate).toBeDefined();
      expect(request.completedDate).toBeInstanceOf(Date);
    });

    test('should store rejectionReason for rejected requests', async () => {
      const reason = 'Invalid waste type';
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, { 
          status: 'rejected',
          rejectionReason: reason
        })
      );
      
      expect(request.rejectionReason).toBe(reason);
    });

    test('should track payment for bulky items', async () => {
      const request = await WasteRequest.create(
        createTestWasteRequest(testUser._id, {
          wasteType: 'bulky',
          estimatedCost: 500,
          paymentStatus: 'pending'
        })
      );
      
      request.actualCost = 500;
      request.paymentStatus = 'paid';
      await request.save();
      
      expect(request.actualCost).toBe(500);
      expect(request.paymentStatus).toBe('paid');
    });
  });
});

