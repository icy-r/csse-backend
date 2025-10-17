const express = require("express");
const router = express.Router();
const workOrderController = require("../controllers/workorder.controller");
const buildQuery = require("../middleware/queryBuilder");

/**
 * @swagger
 * tags:
 *   name: WorkOrders
 *   description: Work order management operations
 */

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: Get all work orders with filtering and pagination
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, in-progress, resolved, escalated, cancelled]
 *         description: Filter by work order status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: issueType
 *         schema:
 *           type: string
 *           enum: [offline, battery-low, sensor-error, physical-damage, other]
 *         description: Filter by issue type
 *       - in: query
 *         name: technicianId
 *         schema:
 *           type: string
 *         description: Filter by assigned technician
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Work orders retrieved successfully
 */
router.get(
  "/",
  buildQuery(["status", "priority", "issueType", "technicianId"]),
  workOrderController.getAllWorkOrders
);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     summary: Get work order by ID
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: Work order retrieved successfully
 *       404:
 *         description: Work order not found
 */
router.get("/:id", workOrderController.getWorkOrderById);

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: Create a new work order
 *     tags: [WorkOrders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - binId
 *               - issueDescription
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: ID of the device with issues
 *                 example: 6543210abc123def456789
 *               binId:
 *                 type: string
 *                 description: ID of the associated bin
 *                 example: 6543210abc123def456790
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 example: high
 *               issueDescription:
 *                 type: string
 *                 description: Detailed description of the issue
 *                 example: Device not responding to commands, possible sensor malfunction
 *               issueType:
 *                 type: string
 *                 enum: [offline, battery-low, sensor-error, physical-damage, other]
 *                 default: other
 *                 example: sensor-error
 *               estimatedResolutionTime:
 *                 type: number
 *                 description: Estimated resolution time in minutes
 *                 example: 120
 *     responses:
 *       201:
 *         description: Work order created successfully
 *       400:
 *         description: Invalid input or missing required fields
 *       404:
 *         description: Device or bin not found
 */
router.post("/", workOrderController.createWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   put:
 *     summary: Update work order information
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               issueDescription:
 *                 type: string
 *               issueType:
 *                 type: string
 *                 enum: [offline, battery-low, sensor-error, physical-damage, other]
 *               estimatedResolutionTime:
 *                 type: number
 *     responses:
 *       200:
 *         description: Work order updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Work order not found
 */
router.put("/:id", workOrderController.updateWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/assign:
 *   put:
 *     summary: Assign work order to technician
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - technicianId
 *             properties:
 *               technicianId:
 *                 type: string
 *                 description: ID of the technician to assign
 *                 example: 6543210abc123def456791
 *     responses:
 *       200:
 *         description: Work order assigned successfully
 *       400:
 *         description: Invalid request or work order not in pending status
 *       404:
 *         description: Work order not found
 */
router.put("/:id/assign", workOrderController.assignWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/start:
 *   put:
 *     summary: Start work on assigned work order
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: Work order started successfully
 *       400:
 *         description: Work order not in assigned status
 *       404:
 *         description: Work order not found
 */
router.put("/:id/start", workOrderController.startWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/resolve:
 *   put:
 *     summary: Resolve work order
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actionTaken
 *               - resolutionNotes
 *             properties:
 *               actionTaken:
 *                 type: string
 *                 enum: [repaired, replaced]
 *                 example: repaired
 *               resolutionNotes:
 *                 type: string
 *                 description: Detailed notes about the resolution
 *                 example: Replaced faulty sensor, tested functionality
 *               newDeviceId:
 *                 type: string
 *                 description: Required if actionTaken is 'replaced'
 *                 example: 6543210abc123def456792
 *     responses:
 *       200:
 *         description: Work order resolved successfully
 *       400:
 *         description: Invalid input or work order not in progress
 *       404:
 *         description: Work order not found
 */
router.put("/:id/resolve", workOrderController.resolveWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/escalate:
 *   put:
 *     summary: Escalate work order to supervisor
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for escalation
 *                 example: Requires specialized equipment not available
 *     responses:
 *       200:
 *         description: Work order escalated successfully
 *       400:
 *         description: Invalid request or work order not in progress
 *       404:
 *         description: Work order not found
 */
router.put("/:id/escalate", workOrderController.escalateWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}/cancel:
 *   put:
 *     summary: Cancel work order
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: Issue resolved by other means
 *     responses:
 *       200:
 *         description: Work order cancelled successfully
 *       400:
 *         description: Work order cannot be cancelled in current status
 *       404:
 *         description: Work order not found
 */
router.put("/:id/cancel", workOrderController.cancelWorkOrder);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   delete:
 *     summary: Delete work order (Admin only)
 *     tags: [WorkOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Work order ID
 *     responses:
 *       200:
 *         description: Work order deleted successfully
 *       404:
 *         description: Work order not found
 */
router.delete("/:id", workOrderController.deleteWorkOrder);

module.exports = router;
