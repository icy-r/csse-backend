const express = require('express');
const router = express.Router();
const crewController = require('../controllers/crew.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Crew
 *   description: Crew member operations
 */

/**
 * @swagger
 * /api/crew/dashboard:
 *   get:
 *     summary: Get crew dashboard with statistics and current assignments
 *     tags: [Crew]
 *     parameters:
 *       - in: query
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       400:
 *         description: Crew ID is required
 *       404:
 *         description: Crew member not found
 */
router.get('/dashboard', crewController.getCrewDashboard);

/**
 * @swagger
 * /api/crew/routes/active:
 *   get:
 *     summary: Get crew's active route
 *     tags: [Crew]
 *     parameters:
 *       - in: query
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *     responses:
 *       200:
 *         description: Active route retrieved successfully
 *       400:
 *         description: Crew ID is required
 */
router.get('/routes/active', crewController.getActiveRoute);

/**
 * @swagger
 * /api/crew/routes:
 *   get:
 *     summary: Get crew's assigned routes
 *     tags: [Crew]
 *     parameters:
 *       - in: query
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, assigned, in-progress, completed, cancelled]
 *         description: Filter by route status
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
 *         description: Routes retrieved successfully
 *       400:
 *         description: Missing crew ID
 *       500:
 *         description: Server error
 */
router.get('/routes', buildQuery(['status', 'scheduledDate']), crewController.getMyRoutes);

/**
 * @swagger
 * /api/crew/routes/{id}:
 *   get:
 *     summary: Get route details with stops
 *     tags: [Crew]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route details retrieved
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.get('/routes/:id', crewController.getRouteDetails);

/**
 * @swagger
 * /api/crew/routes/{routeId}/stops/{stopIndex}:
 *   put:
 *     summary: Update stop status
 *     tags: [Crew]
 *     parameters:
 *       - in: path
 *         name: routeId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, skipped]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stop status updated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Route not found
 *       500:
 *         description: Server error
 */
router.put('/routes/:routeId/stops/:stopIndex', crewController.updateStopStatus);

/**
 * @swagger
 * /api/crew/issues:
 *   post:
 *     summary: Report issue during collection
 *     tags: [Crew]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - crewId
 *               - issueType
 *               - description
 *             properties:
 *               crewId:
 *                 type: string
 *               routeId:
 *                 type: string
 *               issueType:
 *                 type: string
 *                 enum: [blocked-access, bin-full, bin-damaged, vehicle-issue, safety-concern, other]
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               stopIndex:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Issue reported successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/issues', crewController.reportIssue);

/**
 * @swagger
 * /api/crew/profile:
 *   get:
 *     summary: Get crew member profile
 *     tags: [Crew]
 *     parameters:
 *       - in: query
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       400:
 *         description: Missing crew ID
 *       404:
 *         description: Crew member not found
 *       500:
 *         description: Server error
 */
router.get('/profile', crewController.getProfile);

module.exports = router;

