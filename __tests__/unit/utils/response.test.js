/**
 * Response Helper Unit Tests
 * Tests for standardized API response functions
 */

const { successResponse, errorResponse } = require('../../../src/utils/response');
const { mockResponse } = require('../../helpers/testHelpers');

describe('Response Helpers', () => {
  describe('successResponse', () => {
    test('should send success response with data', () => {
      const res = mockResponse();
      const data = { id: 1, name: 'Test' };
      
      successResponse(res, 'Success message', data);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message',
        data: data
      });
    });

    test('should send success response without data', () => {
      const res = mockResponse();
      
      successResponse(res, 'Success message');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success message'
      });
    });

    test('should send success response with custom status code', () => {
      const res = mockResponse();
      const data = { id: 1 };
      
      successResponse(res, 'Created', data, 201);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: data
      });
    });

    test('should include pagination data', () => {
      const res = mockResponse();
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 50,
        totalPages: 5
      };
      
      successResponse(res, 'Data retrieved', data, 200, pagination);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data retrieved',
        data: data,
        pagination: pagination
      });
    });

    test('should handle null data', () => {
      const res = mockResponse();
      
      successResponse(res, 'Success', null);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success'
      });
    });

    test('should handle empty array data', () => {
      const res = mockResponse();
      
      successResponse(res, 'No data found', []);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'No data found',
        data: []
      });
    });

    test('should handle empty object data', () => {
      const res = mockResponse();
      
      successResponse(res, 'Success', {});
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: {}
      });
    });

    test('should handle 204 No Content status', () => {
      const res = mockResponse();
      
      successResponse(res, 'Deleted successfully', null, 204);
      
      expect(res.status).toHaveBeenCalledWith(204);
    });

    test('should handle boolean data', () => {
      const res = mockResponse();
      
      successResponse(res, 'Operation result', false);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operation result',
        data: false
      });
    });

    test('should handle numeric data', () => {
      const res = mockResponse();
      
      successResponse(res, 'Count retrieved', 42);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Count retrieved',
        data: 42
      });
    });
  });

  describe('errorResponse', () => {
    test('should send error response with default status', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Error occurred');
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error occurred'
      });
    });

    test('should send error response with custom status code', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Not found', 404);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found'
      });
    });

    test('should include validation errors array', () => {
      const res = mockResponse();
      const errors = ['Field is required', 'Invalid email format'];
      
      errorResponse(res, 'Validation failed', 400, errors);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    });

    test('should handle 400 Bad Request', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Bad request', 400);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle 401 Unauthorized', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Unauthorized', 401);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle 403 Forbidden', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Forbidden', 403);
      
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should handle 404 Not Found', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Resource not found', 404);
      
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle 409 Conflict', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Conflict', 409);
      
      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('should handle 500 Internal Server Error', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Internal server error', 500);
      
      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle errors as object', () => {
      const res = mockResponse();
      const errors = {
        email: 'Email is invalid',
        password: 'Password too short'
      };
      
      errorResponse(res, 'Validation failed', 400, errors);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    });

    test('should handle empty errors', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Error', 500, []);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error',
        errors: []
      });
    });

    test('should handle null errors', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Error', 500, null);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error'
      });
    });
  });

  describe('Response consistency', () => {
    test('success response should always have success: true', () => {
      const res = mockResponse();
      
      successResponse(res, 'Test');
      
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
    });

    test('error response should always have success: false', () => {
      const res = mockResponse();
      
      errorResponse(res, 'Test');
      
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    test('both responses should always have message', () => {
      const res1 = mockResponse();
      const res2 = mockResponse();
      
      successResponse(res1, 'Success');
      errorResponse(res2, 'Error');
      
      const successResp = res1.json.mock.calls[0][0];
      const errorResp = res2.json.mock.calls[0][0];
      
      expect(successResp.message).toBeDefined();
      expect(errorResp.message).toBeDefined();
    });
  });
});

