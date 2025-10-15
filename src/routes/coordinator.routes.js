const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinator.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Coordinator
 *   description: Collection coordinator operations
 */

/**
 * @swagger
 * /api/coordinator/dashboard:
 *   get:
 *     summary: Get coordinator dashboard with statistics
 *     tags: [Coordinator]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     bins:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         full:
 *                           type: number
 *                         filling:
 *                           type: number
 *                     requests:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: number
 *                         approved:
 *                           type: number
 *                     routes:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: number
 */
router.get('/dashboard', coordinatorController.getDashboard);

/**
 * @swagger
 * /api/coordinator/bins:
 *   get:
 *     summary: Get all bins with fill levels and status
 *     tags: [Coordinator]
 *     parameters:
 *       - in: query
 *         name: fillLevel[gte]
 *         schema:
 *           type: number
 *         description: Filter bins by minimum fill level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by bin status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field (e.g., fillLevel:desc)
 *     responses:
 *       200:
 *         description: Bins retrieved successfully
 */
router.get('/bins', buildQuery(['status', 'fillLevel', 'binType']), coordinatorController.getBins);

/**
 * @swagger
 * /api/coordinator/requests/pending:
 *   get:
 *     summary: Get pending waste pickup requests
 *     tags: [Coordinator]
 *     responses:
 *       200:
 *         description: Pending requests retrieved
 */
router.get('/requests/pending', buildQuery(['status']), coordinatorController.getPendingRequests);

/**
 * @swagger
 * /api/coordinator/requests/{id}/approve:
 *   put:
 *     summary: Approve a waste request
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request approved
 */
router.put('/requests/:id/approve', coordinatorController.approveRequest);

/**
 * @swagger
 * /api/coordinator/requests/{id}/reject:
 *   put:
 *     summary: Reject a waste request
 *     tags: [Coordinator]
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
 *         description: Request rejected
 */
router.put('/requests/:id/reject', coordinatorController.rejectRequest);

/**
 * @swagger
 * /api/coordinator/routes/optimize:
 *   post:
 *     summary: Generate optimized collection route
 *     tags: [Coordinator]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fillLevelThreshold:
 *                 type: number
 *                 default: 90
 *               includeApprovedRequests:
 *                 type: boolean
 *                 default: true
 *               maxStops:
 *                 type: number
 *                 default: 50
 *     responses:
 *       200:
 *         description: Route optimized successfully
 */
router.post('/routes/optimize', coordinatorController.optimizeRouteHandler);

/**
 * @swagger
 * /api/coordinator/routes:
 *   post:
 *     summary: Create a new collection route
 *     tags: [Coordinator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeName:
 *                 type: string
 *               coordinatorId:
 *                 type: string
 *               stops:
 *                 type: array
 *               totalDistance:
 *                 type: number
 *               estimatedDuration:
 *                 type: number
 *     responses:
 *       201:
 *         description: Route created
 *   get:
 *     summary: Get all routes with filtering
 *     tags: [Coordinator]
 *     parameters:
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
 *         description: Routes retrieved
 */
router.post('/routes', coordinatorController.createRoute);
router.get('/routes', buildQuery(['status', 'coordinatorId', 'crewId', 'scheduledDate']), coordinatorController.getRoutes);

/**
 * @swagger
 * /api/coordinator/routes/{id}:
 *   get:
 *     summary: Get route details
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Route details retrieved
 */
router.get('/routes/:id', coordinatorController.getRouteDetails);

/**
 * @swagger
 * /api/coordinator/routes/{id}/assign:
 *   put:
 *     summary: Assign route to crew
 *     tags: [Coordinator]
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
 *               crewId:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Route assigned successfully
 */
router.put('/routes/:id/assign', coordinatorController.assignRoute);

/**
 * @swagger
 * /api/coordinator/routes/{id}/status:
 *   put:
 *     summary: Update route status
 *     tags: [Coordinator]
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
 *                 enum: [draft, assigned, in-progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/routes/:id/status', coordinatorController.updateRouteStatus);

/**
 * @swagger
 * /api/coordinator/routes/{id}/stops/{stopIndex}:
 *   put:
 *     summary: Update stop status in route
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: stopIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, skipped]
 *     responses:
 *       200:
 *         description: Stop status updated
 */
router.put('/routes/:id/stops/:stopIndex', coordinatorController.updateStopStatus);

module.exports = router;

