const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: System administration operations
 */

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users with filtering
 *     tags: [Admin]
 *     description: Retrieve a list of all users with optional filtering by role, status, email, or name
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [citizen, coordinator, technician, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         description: Filter by user status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *   post:
 *     summary: Create a new user
 *     tags: [Admin]
 *     description: Create a new user account in the system (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (must be unique)
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+94771234567"
 *               role:
 *                 type: string
 *                 enum: [citizen, coordinator, technician, admin]
 *                 description: User role in the system
 *                 example: citizen
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *                 description: User account status (optional, defaults to 'active')
 *                 default: active
 *                 example: active
 *               address:
 *                 type: object
 *                 description: User address (optional)
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main Street"
 *                   city:
 *                     type: string
 *                     example: "Colombo"
 *                   postalCode:
 *                     type: string
 *                     example: "10100"
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: 6.9271
 *                       lng:
 *                         type: number
 *                         example: 79.8612
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Missing required fields (name, email, phone, role)"
 *       500:
 *         description: Server error (e.g., duplicate email)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "email already exists"
 */
router.get('/users', buildQuery(['role', 'status', 'email', 'name']), adminController.getUsers);
router.post('/users', adminController.createUser);

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [citizen, coordinator, technician, admin]
 *     responses:
 *       200:
 *         description: User role updated
 */
router.put('/users/:id/role', adminController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @swagger
 * /api/admin/reports/collections:
 *   get:
 *     summary: Get collection statistics report
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Collection statistics retrieved
 */
router.get('/reports/collections', adminController.getCollectionReports);

/**
 * @swagger
 * /api/admin/reports/efficiency:
 *   get:
 *     summary: Get route efficiency report
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Efficiency report retrieved
 */
router.get('/reports/efficiency', adminController.getEfficiencyReports);

/**
 * @swagger
 * /api/admin/reports/devices:
 *   get:
 *     summary: Get device uptime and maintenance report
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Device report retrieved
 */
router.get('/reports/devices', adminController.getDeviceReports);

/**
 * @swagger
 * /api/admin/system/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: System health retrieved
 */
router.get('/system/health', adminController.getSystemHealth);

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard with system overview
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @swagger
 * /api/admin/export:
 *   get:
 *     summary: Export system data
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [users, requests, bins, routes]
 *     responses:
 *       200:
 *         description: Data exported successfully
 */
router.get('/export', adminController.exportData);

module.exports = router;

