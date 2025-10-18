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
 *                   example: "Dashboard data retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     crew:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     profile:
 *                       type: object
 *                       properties:
 *                         vehicleId:
 *                           type: string
 *                         availability:
 *                           type: string
 *                           enum: [available, unavailable, on-leave]
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalRoutes:
 *                           type: integer
 *                         completedRoutes:
 *                           type: integer
 *                         pendingRoutes:
 *                           type: integer
 *                         completionRate:
 *                           type: integer
 *                     activeRoute:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [assigned, in-progress]
 *                         scheduledDate:
 *                           type: string
 *                           format: date
 *                         totalStops:
 *                           type: integer
 *                         completedStops:
 *                           type: integer
 *                         coordinator:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             phone:
 *                               type: string
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           routeName:
 *                             type: string
 *                           status:
 *                             type: string
 *                           scheduledDate:
 *                             type: string
 *                             format: date
 *                           completionPercentage:
 *                             type: integer
 *       400:
 *         description: Crew ID is required
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
 *                   example: "Crew ID is required"
 *       404:
 *         description: Crew member not found
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
 *                   example: "Crew member not found"
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
 *                   example: "Active route retrieved successfully"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     _id:
 *                       type: string
 *                     routeName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [assigned, in-progress]
 *                     scheduledDate:
 *                       type: string
 *                       format: date
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     stops:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stopType:
 *                             type: string
 *                             enum: [bin, request]
 *                           referenceId:
 *                             type: string
 *                           sequence:
 *                             type: integer
 *                           address:
 *                             type: string
 *                           coordinates:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                               lng:
 *                                 type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, skipped]
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           notes:
 *                             type: string
 *                           details:
 *                             type: object
 *                             nullable: true
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                     vehicleId:
 *                       type: string
 *                       nullable: true
 *                     coordinatorId:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     totalStops:
 *                       type: integer
 *                     completedStops:
 *                       type: integer
 *                     pendingStops:
 *                       type: integer
 *                     completionPercentage:
 *                       type: integer
 *       400:
 *         description: Crew ID is required
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
 *                   example: "Crew ID is required"
 */
router.get('/routes/active', crewController.getActiveRoute);

/**
 * @swagger
 * /api/crew/routes:
 *   get:
 *     summary: Get crew's assigned routes with pagination
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
 *         name: scheduledDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by scheduled date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "scheduledDate:desc"
 *         description: Sort field and order (field:asc/desc)
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
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
 *                   example: "Routes retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       routeName:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [draft, assigned, in-progress, completed, cancelled]
 *                       scheduledDate:
 *                         type: string
 *                         format: date
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       totalDistance:
 *                         type: number
 *                         nullable: true
 *                       estimatedDuration:
 *                         type: number
 *                         nullable: true
 *                       completionPercentage:
 *                         type: integer
 *                         nullable: true
 *                       stops:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             stopType:
 *                               type: string
 *                               enum: [bin, request]
 *                             referenceId:
 *                               type: string
 *                             sequence:
 *                               type: integer
 *                             status:
 *                               type: string
 *                               enum: [pending, completed, skipped]
 *                       coordinatorId:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       totalStops:
 *                         type: integer
 *                       completedStops:
 *                         type: integer
 *                       pendingStops:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                     nextPage:
 *                       type: integer
 *                       nullable: true
 *                     prevPage:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Missing crew ID
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
 *                   example: "Crew ID is required"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.get('/routes', buildQuery(['status', 'scheduledDate']), crewController.getMyRoutes);

/**
 * @swagger
 * /api/crew/routes/{id}:
 *   get:
 *     summary: Get detailed route information with populated stops
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
 *         description: Route details retrieved successfully
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
 *                   example: "Route details retrieved"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     routeName:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [draft, assigned, in-progress, completed, cancelled]
 *                     scheduledDate:
 *                       type: string
 *                       format: date
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     totalDistance:
 *                       type: number
 *                       nullable: true
 *                     estimatedDuration:
 *                       type: number
 *                       nullable: true
 *                     completionPercentage:
 *                       type: integer
 *                       nullable: true
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                     vehicleId:
 *                       type: string
 *                       nullable: true
 *                     coordinatorId:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     crewId:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                     stops:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stopType:
 *                             type: string
 *                             enum: [bin, request]
 *                           referenceId:
 *                             type: string
 *                           sequence:
 *                             type: integer
 *                           address:
 *                             type: string
 *                           coordinates:
 *                             type: object
 *                             properties:
 *                               lat:
 *                                 type: number
 *                               lng:
 *                                 type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, skipped]
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           notes:
 *                             type: string
 *                           details:
 *                             type: object
 *                             nullable: true
 *                             description: Populated bin or request details
 *       404:
 *         description: Route not found
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
 *                   example: "Route not found"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.get('/routes/:id', crewController.getRouteDetails);

/**
 * @swagger
 * /api/crew/routes/{routeId}/stops/{stopIndex}:
 *   put:
 *     summary: Update stop status during route execution
 *     tags: [Crew]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *       - in: path
 *         name: stopIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index of the stop in the route (0-based)
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
 *                 description: New status for the stop
 *               notes:
 *                 type: string
 *                 description: Optional notes (required when status is 'skipped')
 *                 maxLength: 500
 *               wasteQuantity:
 *                 type: number
 *                 description: Optional - Quantity of waste collected (in kg or liters)
 *               collectionTime:
 *                 type: number
 *                 description: Optional - Time taken for collection (in minutes)
 *           examples:
 *             completed:
 *               summary: Mark stop as completed
 *               value:
 *                 status: "completed"
 *                 notes: "Successfully collected waste"
 *             completed_with_details:
 *               summary: Mark stop as completed with collection details
 *               value:
 *                 status: "completed"
 *                 notes: "Collected from residential bin"
 *                 wasteQuantity: 45.5
 *                 collectionTime: 3
 *             skipped:
 *               summary: Skip stop with reason
 *               value:
 *                 status: "skipped"
 *                 notes: "Bin was inaccessible due to construction"
 *     responses:
 *       200:
 *         description: Stop status updated successfully. If stop type is 'bin' and status is 'completed', the bin will be automatically emptied.
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
 *                   example: "Stop status updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                     stopIndex:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, skipped]
 *                     completionPercentage:
 *                       type: integer
 *                       description: Updated route completion percentage
 *                     routeStatus:
 *                       type: string
 *                       enum: [assigned, in-progress, completed]
 *                       description: Updated route status
 *               description: |
 *                 Note: When marking a bin stop as completed, the bin's fill level is automatically reset to 0,
 *                 lastEmptied is updated, and collectionCount is incremented.
 *       400:
 *         description: Invalid request data
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
 *                   examples:
 *                     missing_status:
 *                       value: "Status is required"
 *                     invalid_status:
 *                       value: "Invalid status. Must be: pending, completed, or skipped"
 *                     missing_notes:
 *                       value: "Notes are required when skipping a stop"
 *                     invalid_index:
 *                       value: "Invalid stop index"
 *       404:
 *         description: Route not found
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
 *                   example: "Route not found"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.put('/routes/:routeId/stops/:stopIndex', crewController.updateStopStatus);

/**
 * @swagger
 * /api/crew/issues:
 *   post:
 *     summary: Report issues encountered during waste collection
 *     deprecated: true
 *     description: This endpoint is deprecated. Please use POST /api/issues instead for better issue tracking and management.
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
 *                 description: ID of the crew member reporting the issue
 *               routeId:
 *                 type: string
 *                 description: ID of the route where the issue occurred
 *                 nullable: true
 *               issueType:
 *                 type: string
 *                 enum: [blocked-access, bin-full, bin-damaged, vehicle-issue, safety-concern, other]
 *                 description: Type of issue encountered
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *                 maxLength: 1000
 *               location:
 *                 type: string
 *                 description: Specific location where the issue occurred
 *                 maxLength: 200
 *               stopIndex:
 *                 type: integer
 *                 description: Index of the stop where the issue occurred (if applicable)
 *                 minimum: 0
 *                 nullable: true
 *           examples:
 *             blocked_access:
 *               summary: Bin access blocked
 *               value:
 *                 crewId: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                 routeId: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                 issueType: "blocked-access"
 *                 description: "Construction vehicles blocking access to bin"
 *                 location: "123 Main Street"
 *                 stopIndex: 2
 *             vehicle_issue:
 *               summary: Vehicle breakdown
 *               value:
 *                 crewId: "60f7b3b3b3b3b3b3b3b3b3b3"
 *                 routeId: "60f7b3b3b3b3b3b3b3b3b3b4"
 *                 issueType: "vehicle-issue"
 *                 description: "Truck engine overheating, need assistance"
 *                 location: "Near Central Park"
 *     responses:
 *       201:
 *         description: Issue reported successfully
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
 *                   example: "Issue reported successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     routeId:
 *                       type: string
 *                     issueType:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields
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
 *                   example: "Crew ID, issue type, and description are required"
 *       404:
 *         description: Route not found (if routeId provided)
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
 *                   example: "Route not found"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.post('/issues', crewController.reportIssue);

/**
 * @swagger
 * /api/crew/profile:
 *   get:
 *     summary: Get crew member profile with current route information
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
 *                   example: "Profile retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         role:
 *                           type: string
 *                           example: "crew"
 *                         status:
 *                           type: string
 *                           enum: [active, inactive, suspended]
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                     profile:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         vehicleId:
 *                           type: string
 *                           nullable: true
 *                         availability:
 *                           type: string
 *                           enum: [available, unavailable, on-leave]
 *                         currentRouteId:
 *                           type: string
 *                           nullable: true
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                         totalRoutesCompleted:
 *                           type: integer
 *                         averageCompletionTime:
 *                           type: number
 *                           nullable: true
 *                     currentRoute:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         _id:
 *                           type: string
 *                         routeName:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [assigned, in-progress]
 *                         scheduledDate:
 *                           type: string
 *                           format: date
 *                         completionPercentage:
 *                           type: integer
 *       400:
 *         description: Missing crew ID
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
 *                   example: "Crew ID is required"
 *       404:
 *         description: Crew member not found
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
 *                   example: "Crew member not found"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.get('/profile', crewController.getProfile);

/**
 * @swagger
 * /api/crew/profile/{crewId}/availability:
 *   put:
 *     summary: Update crew member availability status
 *     tags: [Crew]
 *     parameters:
 *       - in: path
 *         name: crewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - availability
 *             properties:
 *               availability:
 *                 type: string
 *                 enum: [available, unavailable, on-leave]
 *                 description: New availability status
 *           examples:
 *             available:
 *               summary: Set as available
 *               value:
 *                 availability: "available"
 *             unavailable:
 *               summary: Set as unavailable
 *               value:
 *                 availability: "unavailable"
 *             on_leave:
 *               summary: Set as on leave
 *               value:
 *                 availability: "on-leave"
 *     responses:
 *       200:
 *         description: Availability updated successfully
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
 *                   example: "Availability updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     crewId:
 *                       type: string
 *                     crewName:
 *                       type: string
 *                     availability:
 *                       type: string
 *                       enum: [available, unavailable, on-leave]
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid availability status or missing data
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
 *                   examples:
 *                     missing_data:
 *                       value: "Crew ID and availability are required"
 *                     invalid_status:
 *                       value: "Invalid availability. Must be one of: available, unavailable, on-leave"
 *       404:
 *         description: Crew member not found
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
 *                   example: "Crew member not found"
 *       500:
 *         description: Server error
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
 *                   example: "Internal server error"
 */
router.put('/profile/:crewId/availability', crewController.updateCrewAvailability);

module.exports = router;

