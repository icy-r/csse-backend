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

// ============================================
// PRIVACY SETTINGS ROUTES
// ============================================

/**
 * @swagger
 * /api/admin/privacy-settings:
 *   get:
 *     summary: Get privacy settings
 *     tags: [Admin]
 *     description: Retrieve current privacy and data protection settings
 *     responses:
 *       200:
 *         description: Privacy settings retrieved successfully
 *   put:
 *     summary: Update privacy settings
 *     tags: [Admin]
 *     description: Update privacy and data protection settings
 *     parameters:
 *       - in: query
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID performing the update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dataEncryption:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *               dataRetention:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: number
 *                   autoDelete:
 *                     type: boolean
 *               anonymization:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       400:
 *         description: Missing admin ID
 */
router.get('/privacy-settings', adminController.getPrivacySettings);
router.put('/privacy-settings', adminController.updatePrivacySettings);

/**
 * @swagger
 * /api/admin/privacy-settings/export:
 *   get:
 *     summary: Export privacy compliance report
 *     tags: [Admin]
 *     description: Generate and export privacy compliance report
 *     responses:
 *       200:
 *         description: Privacy report generated successfully
 */
router.get('/privacy-settings/export', adminController.exportPrivacyReport);

// ============================================
// SECURITY MONITORING ROUTES
// ============================================

/**
 * @swagger
 * /api/admin/security/logs:
 *   get:
 *     summary: Get security logs
 *     tags: [Admin]
 *     description: Retrieve security event logs with filtering
 *     parameters:
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [login-success, login-failed, logout, password-change, role-change, suspicious-activity]
 *         description: Filter by event type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity level
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Security logs retrieved successfully
 */
router.get('/security/logs', buildQuery(['eventType', 'userId', 'success', 'severity', 'ipAddress']), adminController.getSecurityLogs);

/**
 * @swagger
 * /api/admin/security/sessions:
 *   get:
 *     summary: Get active user sessions
 *     tags: [Admin]
 *     description: Retrieve list of active user sessions (based on recent logins)
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 */
router.get('/security/sessions', adminController.getActiveSessions);

/**
 * @swagger
 * /api/admin/security/force-logout/{userId}:
 *   post:
 *     summary: Force logout a user
 *     tags: [Admin]
 *     description: Force logout a specific user (logs the action)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to force logout
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Admin ID performing the action
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       404:
 *         description: User not found
 */
router.post('/security/force-logout/:userId', adminController.forceLogout);

/**
 * @swagger
 * /api/admin/security/policies:
 *   put:
 *     summary: Update security policies
 *     tags: [Admin]
 *     description: Update system security policies
 *     parameters:
 *       - in: query
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID performing the update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policies:
 *                 type: object
 *                 properties:
 *                   auditLogging:
 *                     type: object
 *                     properties:
 *                       level:
 *                         type: string
 *                         enum: [off, basic, detailed, verbose]
 *                   compliance:
 *                     type: object
 *     responses:
 *       200:
 *         description: Security policies updated successfully
 */
router.put('/security/policies', adminController.updateSecurityPolicies);

// ============================================
// BILLING CONFIGURATION ROUTES
// ============================================

/**
 * @swagger
 * /api/admin/billing/config:
 *   get:
 *     summary: Get billing configuration
 *     tags: [Admin]
 *     description: Retrieve billing rates and payment gateway configuration
 *     responses:
 *       200:
 *         description: Billing configuration retrieved successfully
 *   put:
 *     summary: Update billing configuration
 *     tags: [Admin]
 *     description: Update billing rates and payment settings
 *     parameters:
 *       - in: query
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin user ID performing the update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wasteTypeRates:
 *                 type: object
 *                 description: Rates for different waste types
 *               taxConfiguration:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   vatRate:
 *                     type: number
 *               paymentGateway:
 *                 type: object
 *                 properties:
 *                   provider:
 *                     type: string
 *                     enum: [stripe, paypal, payhere, manual, none]
 *     responses:
 *       200:
 *         description: Billing configuration updated successfully
 *       400:
 *         description: Missing admin ID
 */
router.get('/billing/config', adminController.getBillingConfig);
router.put('/billing/config', adminController.updateBillingConfig);

/**
 * @swagger
 * /api/admin/reports/payments:
 *   get:
 *     summary: Get payment reports
 *     tags: [Admin]
 *     description: Generate payment and revenue reports
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period
 *     responses:
 *       200:
 *         description: Payment report generated successfully
 */
router.get('/reports/payments', adminController.getPaymentReports);

module.exports = router;

