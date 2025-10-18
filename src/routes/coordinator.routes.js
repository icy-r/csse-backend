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

/**
 * @swagger
 * /api/coordinator/crews:
 *   get:
 *     summary: Get all crew members
 *     tags: [Coordinator]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (active, inactive, suspended)
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
 *         description: Crew members retrieved successfully
 *   post:
 *     summary: Create new crew member
 *     tags: [Coordinator]
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
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               vehicleId:
 *                 type: string
 *               address:
 *                 type: object
 *     responses:
 *       201:
 *         description: Crew member created successfully
 */
router.get('/crews', buildQuery(['status']), coordinatorController.getCrews);
router.post('/crews', coordinatorController.createCrew);

/**
 * @swagger
 * /api/coordinator/crews/{id}:
 *   get:
 *     summary: Get crew member details
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Crew member's user ID
 *     responses:
 *       200:
 *         description: Crew details retrieved
 *       404:
 *         description: Crew member not found
 */
router.get('/crews/:id', coordinatorController.getCrewDetails);

/**
 * @swagger
 * /api/coordinator/crews/{id}/availability:
 *   put:
 *     summary: Update crew availability status
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 enum: [available, assigned, unavailable, on-leave]
 *     responses:
 *       200:
 *         description: Availability updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Crew member not found
 */
router.put('/crews/:id/availability', coordinatorController.updateCrewAvailability);

// Vehicle Management Routes
const vehicleController = require('../controllers/vehicle.controller');

/**
 * @swagger
 * /api/coordinator/vehicles:
 *   get:
 *     summary: Get all vehicles with filtering
 *     tags: [Coordinator]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, in-use, maintenance, decommissioned]
 *         description: Filter by vehicle status
 *       - in: query
 *         name: vehicleType
 *         schema:
 *           type: string
 *         description: Filter by vehicle type
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
 *         description: Vehicles retrieved successfully
 *   post:
 *     summary: Create new vehicle
 *     tags: [Coordinator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - licensePlate
 *               - vehicleType
 *               - capacity
 *             properties:
 *               vehicleId:
 *                 type: string
 *               licensePlate:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [truck, van, compactor, pickup]
 *               capacity:
 *                 type: number
 *               manufacturer:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: number
 *               fuelType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 */
router.get('/vehicles', buildQuery(['status', 'vehicleType', 'vehicleId']), vehicleController.getVehicles);
router.post('/vehicles', vehicleController.createVehicle);

/**
 * @swagger
 * /api/coordinator/vehicles/available:
 *   get:
 *     summary: Get available vehicles for route assignment
 *     tags: [Coordinator]
 *     responses:
 *       200:
 *         description: Available vehicles retrieved
 */
router.get('/vehicles/available', vehicleController.getAvailableVehicles);

/**
 * @swagger
 * /api/coordinator/vehicles/{id}:
 *   get:
 *     summary: Get vehicle details
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle details retrieved
 *   put:
 *     summary: Update vehicle
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Vehicle updated
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Coordinator]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vehicle deleted
 */
router.get('/vehicles/:id', vehicleController.getVehicleDetails);
router.put('/vehicles/:id', vehicleController.updateVehicle);
router.delete('/vehicles/:id', vehicleController.deleteVehicle);

/**
 * @swagger
 * /api/coordinator/vehicles/{id}/status:
 *   put:
 *     summary: Update vehicle status
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
 *                 enum: [available, in-use, maintenance, decommissioned]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/vehicles/:id/status', vehicleController.updateVehicleStatus);

/**
 * @swagger
 * /api/coordinator/vehicles/{id}/maintenance:
 *   post:
 *     summary: Add maintenance record to vehicle
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
 *             required:
 *               - type
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               technicianName:
 *                 type: string
 *               mileageAtService:
 *                 type: number
 *     responses:
 *       200:
 *         description: Maintenance record added
 */
router.post('/vehicles/:id/maintenance', vehicleController.addMaintenanceRecord);

module.exports = router;

