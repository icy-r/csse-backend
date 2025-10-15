/**
 * User Model Unit Tests
 * Tests for User schema validation, methods, and virtuals
 */

const User = require('../../../src/models/User.model');
const { createTestUser } = require('../../helpers/testHelpers');

describe('User Model', () => {
  describe('Schema Validation', () => {
    test('should create a valid user', async () => {
      const userData = createTestUser();
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.status).toBe('active');
    });

    test('should fail without required fields', async () => {
      const user = new User({});
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.phone).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test('should fail with invalid email format', async () => {
      const userData = createTestUser({ email: 'invalid-email' });
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
    });

    test('should convert email to lowercase', async () => {
      const userData = createTestUser({ email: 'TEST@EXAMPLE.COM' });
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser.email).toBe('test@example.com');
    });

    test('should fail with duplicate email', async () => {
      const email = 'duplicate@example.com';
      await User.create(createTestUser({ email }));
      
      let error;
      try {
        await User.create(createTestUser({ email }));
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    test('should validate role enum', async () => {
      const userData = createTestUser({ role: 'invalid-role' });
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });

    test('should validate status enum', async () => {
      const userData = createTestUser({ status: 'invalid-status' });
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });

    test('should accept all valid roles', async () => {
      const roles = ['citizen', 'coordinator', 'technician', 'admin'];
      
      for (const role of roles) {
        const user = await User.create(createTestUser({ role }));
        expect(user.role).toBe(role);
      }
    });

    test('should accept all valid statuses', async () => {
      const statuses = ['active', 'inactive', 'suspended'];
      
      for (const status of statuses) {
        const user = await User.create(createTestUser({ status }));
        expect(user.status).toBe(status);
      }
    });
  });

  describe('Default Values', () => {
    test('should set default status to active', async () => {
      const userData = createTestUser();
      delete userData.status;
      const user = await User.create(userData);
      
      expect(user.status).toBe('active');
    });

    test('should not set lastLogin by default', async () => {
      const user = await User.create(createTestUser());
      
      expect(user.lastLogin).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    test('should automatically add createdAt and updatedAt', async () => {
      const user = await User.create(createTestUser());
      
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should update updatedAt on save', async () => {
      const user = await User.create(createTestUser());
      const oldUpdatedAt = user.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      user.name = 'Updated Name';
      await user.save();
      
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe('Virtuals', () => {
    test('should return displayName virtual', async () => {
      const user = await User.create(createTestUser({ name: 'John Doe' }));
      const userObj = user.toObject({ virtuals: true });
      
      expect(userObj.displayName).toBe('John Doe');
    });

    test('should fallback to email for displayName if name is missing', async () => {
      const userData = createTestUser({ name: '' });
      const user = await User.create(userData);
      const userObj = user.toObject({ virtuals: true });
      
      expect(userObj.displayName).toBe(user.email);
    });
  });

  describe('Address Subdocument', () => {
    test('should save address with coordinates', async () => {
      const userData = createTestUser();
      const user = await User.create(userData);
      
      expect(user.address.street).toBe(userData.address.street);
      expect(user.address.coordinates.lat).toBe(userData.address.coordinates.lat);
      expect(user.address.coordinates.lng).toBe(userData.address.coordinates.lng);
    });

    test('should allow user without address', async () => {
      const userData = createTestUser();
      delete userData.address;
      const user = await User.create(userData);
      
      expect(user.address).toBeUndefined();
    });
  });

  describe('Query Methods', () => {
    test('should find users by role', async () => {
      await User.create(createTestUser({ role: 'citizen' }));
      await User.create(createTestUser({ role: 'coordinator' }));
      
      const citizens = await User.find({ role: 'citizen' });
      
      expect(citizens.length).toBe(1);
      expect(citizens[0].role).toBe('citizen');
    });

    test('should find users by status', async () => {
      await User.create(createTestUser({ status: 'active' }));
      await User.create(createTestUser({ status: 'inactive' }));
      
      const activeUsers = await User.find({ status: 'active' });
      
      expect(activeUsers.length).toBe(1);
      expect(activeUsers[0].status).toBe('active');
    });

    test('should find user by email', async () => {
      const email = 'findme@example.com';
      await User.create(createTestUser({ email }));
      
      const user = await User.findOne({ email });
      
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long names', async () => {
      const longName = 'A'.repeat(200);
      const user = await User.create(createTestUser({ name: longName }));
      
      expect(user.name).toBe(longName);
    });

    test('should trim whitespace from name', async () => {
      const user = await User.create(createTestUser({ name: '  Test User  ' }));
      
      expect(user.name).toBe('Test User');
    });

    test('should handle special characters in name', async () => {
      const name = "O'Connor-Smith Jr.";
      const user = await User.create(createTestUser({ name }));
      
      expect(user.name).toBe(name);
    });

    test('should handle international phone numbers', async () => {
      const phones = ['+94771234567', '+1-555-123-4567', '+44 20 7946 0958'];
      
      for (const phone of phones) {
        const user = await User.create(createTestUser({ phone }));
        expect(user.phone).toBe(phone);
      }
    });
  });
});

