const express = require("express");
const router = express.Router();
const binController = require("../controllers/bin.controller");
const buildQuery = require("../middleware/queryBuilder");

/**
 * @swagger
 * tags:
 *   name: Bins
 *   description: Smart bin management operations
 */

/**
 * @swagger
 * /api/bins:
 *   get:
 *     summary: Get all bins with filtering and pagination
 *     tags: [Bins]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, offline, maintenance, full]
 *         description: Filter by bin status
 *       - in: query
 *         name: binType
 *         schema:
 *           type: string
 *           enum: [household, recyclable, organic, general]
 *         description: Filter by bin type
 *       - in: query
 *         name: fillLevel
 *         schema:
 *           type: number
 *         description: Filter by fill level (use with comparison operators)
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
 *         description: Bins retrieved successfully
 */
router.get(
  "/",
  buildQuery(["status", "binType", "fillLevel", "location.area"]),
  binController.getAllBins
);

/**
 * @swagger
 * /api/bins/{id}:
 *   get:
 *     summary: Get bin by ID
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     responses:
 *       200:
 *         description: Bin retrieved successfully
 *       404:
 *         description: Bin not found
 */
router.get("/:id", binController.getBinById);

/**
 * @swagger
 * /api/bins:
 *   post:
 *     summary: Create a new smart bin (Admin only)
 *     tags: [Bins]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - binId
 *               - location
 *             properties:
 *               binId:
 *                 type: string
 *                 example: BIN-001
 *               location:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: 123 Main Street
 *                   area:
 *                     type: string
 *                     example: Colombo 05
 *                   coordinates:
 *                     type: object
 *                     required:
 *                       - lat
 *                       - lng
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: 6.9271
 *                       lng:
 *                         type: number
 *                         example: 79.8612
 *               capacity:
 *                 type: number
 *                 default: 240
 *                 example: 240
 *               binType:
 *                 type: string
 *                 enum: [household, recyclable, organic, general]
 *                 default: general
 *               status:
 *                 type: string
 *                 enum: [active, offline, maintenance, full]
 *                 default: active
 *               fillLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *               deviceId:
 *                 type: string
 *                 description: Associated IoT device ID
 *     responses:
 *       201:
 *         description: Bin created successfully
 *       400:
 *         description: Invalid input or missing required fields
 *       409:
 *         description: Bin ID already exists
 */
router.post("/", binController.createBin);

/**
 * @swagger
 * /api/bins/{id}:
 *   put:
 *     summary: Update bin information
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: object
 *               capacity:
 *                 type: number
 *               binType:
 *                 type: string
 *                 enum: [household, recyclable, organic, general]
 *               status:
 *                 type: string
 *                 enum: [active, offline, maintenance, full]
 *               fillLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               deviceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bin updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Bin not found
 */
router.put("/:id", binController.updateBin);

/**
 * @swagger
 * /api/bins/{id}/fill-level:
 *   put:
 *     summary: Update bin fill level
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fillLevel
 *             properties:
 *               fillLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *     responses:
 *       200:
 *         description: Fill level updated successfully
 *       400:
 *         description: Invalid fill level
 *       404:
 *         description: Bin not found
 */
router.put("/:id/fill-level", binController.updateFillLevel);

/**
 * @swagger
 * /api/bins/{id}/empty:
 *   put:
 *     summary: Empty bin (set fill level to 0 and update collection count)
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     responses:
 *       200:
 *         description: Bin emptied successfully
 *       404:
 *         description: Bin not found
 */
router.put("/:id/empty", binController.emptyBin);

/**
 * @swagger
 * /api/bins/{id}/maintenance:
 *   put:
 *     summary: Set bin maintenance status
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isMaintenance
 *             properties:
 *               isMaintenance:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Maintenance status updated
 *       404:
 *         description: Bin not found
 */
router.put("/:id/maintenance", binController.setMaintenance);

/**
 * @swagger
 * /api/bins/{id}:
 *   delete:
 *     summary: Delete bin (Admin only)
 *     tags: [Bins]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Bin ID
 *     responses:
 *       200:
 *         description: Bin deleted successfully
 *       404:
 *         description: Bin not found
 */
router.delete("/:id", binController.deleteBin);

module.exports = router;

