const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technician.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Technician
 *   description: Field technician operations
 */

/**
 * @swagger
 * /api/technician/work-orders:
 *   get:
 *     summary: Get assigned work orders
 *     tags: [Technician]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work orders retrieved
 */
router.get('/work-orders', buildQuery(['status', 'priority', 'technicianId']), technicianController.getWorkOrders);

/**
 * @swagger
 * /api/technician/work-orders/{id}:
 *   get:
 *     summary: Get work order details
 *     tags: [Technician]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order details
 */
router.get('/work-orders/:id', technicianController.getWorkOrderDetails);

/**
 * @swagger
 * /api/technician/work-orders/{id}/assign:
 *   put:
 *     summary: Self-assign a work order
 *     tags: [Technician]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order assigned
 */
router.put('/work-orders/:id/assign', technicianController.assignWorkOrder);

/**
 * @swagger
 * /api/technician/work-orders/{id}/start:
 *   put:
 *     summary: Start working on a work order
 *     tags: [Technician]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order started
 */
router.put('/work-orders/:id/start', technicianController.startWorkOrder);

/**
 * @swagger
 * /api/technician/work-orders/{id}/resolve:
 *   put:
 *     summary: Resolve a work order
 *     tags: [Technician]
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
 *               actionTaken:
 *                 type: string
 *                 enum: [repaired, replaced]
 *               resolutionNotes:
 *                 type: string
 *               newDeviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order resolved
 */
router.put('/work-orders/:id/resolve', technicianController.resolveWorkOrder);

/**
 * @swagger
 * /api/technician/work-orders/{id}/escalate:
 *   put:
 *     summary: Escalate a work order
 *     tags: [Technician]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order escalated
 */
router.put('/work-orders/:id/escalate', technicianController.escalateWorkOrder);

/**
 * @swagger
 * /api/technician/devices/register:
 *   post:
 *     summary: Register a new device
 *     tags: [Technician]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               binId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device registered
 */
router.post('/devices/register', technicianController.registerDevice);

/**
 * @swagger
 * /api/technician/devices/{id}:
 *   get:
 *     summary: Get device details
 *     tags: [Technician]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details
 */
router.get('/devices/:id', technicianController.getDeviceDetails);

/**
 * @swagger
 * /api/technician/devices/{id}/status:
 *   put:
 *     summary: Update device status
 *     tags: [Technician]
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
 *               status:
 *                 type: string
 *                 enum: [active, offline, decommissioned]
 *     responses:
 *       200:
 *         description: Device status updated
 */
router.put('/devices/:id/status', technicianController.updateDeviceStatus);

module.exports = router;

