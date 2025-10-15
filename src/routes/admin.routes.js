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
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [citizen, coordinator, technician, admin]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *   post:
 *     summary: Create a new user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [citizen, coordinator, technician, admin]
 *     responses:
 *       201:
 *         description: User created successfully
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

