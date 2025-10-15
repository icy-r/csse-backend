/**
 * Helper Utilities Unit Tests
 * Tests for cost calculation and other utility functions
 */

const { calculateCost, generateRandomCoordinates, sanitizeSensitiveData } = require('../../../src/utils/helpers');

describe('Helper Utilities', () => {
  describe('calculateCost', () => {
    test('should calculate 0 for household waste', () => {
      const cost = calculateCost('household', '3 bags');
      expect(cost).toBe(0);
    });

    test('should calculate 0 for recyclable waste', () => {
      const cost = calculateCost('recyclable', '5 bags');
      expect(cost).toBe(0);
    });

    test('should calculate 0 for e-waste', () => {
      const cost = calculateCost('e-waste', '2 items');
      expect(cost).toBe(0);
    });

    test('should calculate cost for bulky waste', () => {
      const cost = calculateCost('bulky', '2 items');
      expect(cost).toBe(1000); // 500 per item * 2
    });

    test('should handle single bulky item', () => {
      const cost = calculateCost('bulky', '1 item');
      expect(cost).toBe(500);
    });

    test('should handle multiple bulky items', () => {
      const cost = calculateCost('bulky', '5 items');
      expect(cost).toBe(2500);
    });

    test('should parse numeric quantity from string', () => {
      const cost1 = calculateCost('bulky', '3 big items');
      const cost2 = calculateCost('bulky', '10');
      
      expect(cost1).toBe(1500);
      expect(cost2).toBe(5000);
    });

    test('should return default for invalid waste type', () => {
      const cost = calculateCost('invalid', '2 items');
      expect(cost).toBe(0);
    });

    test('should handle zero quantity', () => {
      const cost = calculateCost('bulky', '0 items');
      expect(cost).toBe(0);
    });

    test('should handle negative quantity gracefully', () => {
      const cost = calculateCost('bulky', '-2 items');
      expect(cost).toBe(-1000); // Will parse as negative number
    });

    test('should handle non-numeric quantity', () => {
      const cost = calculateCost('bulky', 'many items');
      expect(cost).toBe(500); // parseInt returns NaN, falls back to 1
    });
  });

  describe('generateRandomCoordinates', () => {
    test('should generate coordinates near center', () => {
      const center = { lat: 6.9271, lng: 79.8612 };
      const coords = generateRandomCoordinates(center.lat, center.lng, 1);
      
      expect(coords.lat).toBeDefined();
      expect(coords.lng).toBeDefined();
      expect(typeof coords.lat).toBe('number');
      expect(typeof coords.lng).toBe('number');
    });

    test('should generate coordinates within radius', () => {
      const centerLat = 6.9271;
      const centerLng = 79.8612;
      const radiusKm = 5;
      
      const coords = generateRandomCoordinates(centerLat, centerLng, radiusKm);
      
      // Calculate approximate distance
      const latDiff = Math.abs(coords.lat - centerLat);
      const lngDiff = Math.abs(coords.lng - centerLng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.3;
      
      expect(distance).toBeLessThanOrEqual(radiusKm + 1); // +1 for floating point tolerance
    });

    test('should generate different coordinates on each call', () => {
      const coords1 = generateRandomCoordinates(6.9271, 79.8612, 5);
      const coords2 = generateRandomCoordinates(6.9271, 79.8612, 5);
      
      const areDifferent = coords1.lat !== coords2.lat || coords1.lng !== coords2.lng;
      expect(areDifferent).toBe(true);
    });

    test('should handle zero radius', () => {
      const coords = generateRandomCoordinates(6.9271, 79.8612, 0);
      
      expect(coords.lat).toBeCloseTo(6.9271, 4);
      expect(coords.lng).toBeCloseTo(79.8612, 4);
    });

    test('should handle large radius', () => {
      const coords = generateRandomCoordinates(6.9271, 79.8612, 100);
      
      expect(coords.lat).toBeDefined();
      expect(coords.lng).toBeDefined();
      expect(Math.abs(coords.lat - 6.9271)).toBeLessThanOrEqual(1);
    });
  });

  describe('sanitizeSensitiveData', () => {
    test('should sanitize password field', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com'
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.password).toBe('***');
      expect(sanitized.email).toBe('john@example.com');
    });

    test('should sanitize token field', () => {
      const data = {
        userId: '123',
        token: 'abc123xyz'
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.userId).toBe('123');
      expect(sanitized.token).toBe('***');
    });

    test('should sanitize apiKey field', () => {
      const data = {
        service: 'payment',
        apiKey: 'sk_live_123456'
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.service).toBe('payment');
      expect(sanitized.apiKey).toBe('***');
    });

    test('should handle empty object', () => {
      const sanitized = sanitizeSensitiveData({});
      expect(sanitized).toEqual({});
    });

    test('should handle null or undefined', () => {
      const sanitized1 = sanitizeSensitiveData(null);
      const sanitized2 = sanitizeSensitiveData(undefined);
      
      expect(sanitized1).toEqual({});
      expect(sanitized2).toEqual({});
    });

    test('should not modify non-sensitive fields', () => {
      const data = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        active: true
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toEqual(data);
    });

    test('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret'
        },
        settings: {
          theme: 'dark'
        }
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      // Only top-level fields are sanitized (shallow)
      expect(sanitized.user.password).toBe('secret');
      expect(sanitized.settings.theme).toBe('dark');
    });

    test('should handle arrays', () => {
      const data = {
        users: ['user1', 'user2'],
        tokens: ['token1', 'token2']
      };
      
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.users).toEqual(['user1', 'user2']);
      expect(sanitized.tokens).toBe('***');
    });
  });
});

