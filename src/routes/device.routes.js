const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/device.controller");
const buildQuery = require("../middleware/queryBuilder");

/**
 * @swagger
 * tags:
 *   name: Devices
 *   description: IoT device management operations
 */

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices with filtering and pagination
 *     tags: [Devices]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, offline, decommissioned, error]
 *         description: Filter by device status
 *       - in: query
 *         name: deviceType
 *         schema:
 *           type: string
 *           enum: [rfid, qr-code, sensor]
 *         description: Filter by device type
 *       - in: query
 *         name: binId
 *         schema:
 *           type: string
 *         description: Filter by associated bin ID
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
 *         description: Devices retrieved successfully
 */
router.get(
  "/",
  buildQuery(["status", "deviceType", "binId"]),
  deviceController.getAllDevices
);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *       404:
 *         description: Device not found
 */
router.get("/:id", deviceController.getDeviceById);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new IoT device
 *     tags: [Devices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - deviceType
 *             properties:
 *               deviceId:
 *                 type: string
 *                 description: Unique device identifier
 *                 example: DEV-001
 *               deviceType:
 *                 type: string
 *                 enum: [rfid, qr-code, sensor]
 *                 description: Type of IoT device
 *                 example: sensor
 *               binId:
 *                 type: string
 *                 description: Associated bin ID (optional)
 *                 example: 6543210abc123def456789
 *               status:
 *                 type: string
 *                 enum: [active, offline, decommissioned, error]
 *                 default: active
 *                 example: active
 *               batteryLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Battery level percentage
 *                 example: 85
 *               firmwareVersion:
 *                 type: string
 *                 description: Device firmware version
 *                 example: v1.2.3
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Invalid input or missing required fields
 *       404:
 *         description: Associated bin not found
 *       409:
 *         description: Device ID already exists
 */
router.post("/", deviceController.createDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update device information
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceType:
 *                 type: string
 *                 enum: [rfid, qr-code, sensor]
 *               binId:
 *                 type: string
 *                 description: Associated bin ID
 *               status:
 *                 type: string
 *                 enum: [active, offline, decommissioned, error]
 *               batteryLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               firmwareVersion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Device not found
 */
router.put("/:id", deviceController.updateDevice);

/**
 * @swagger
 * /api/devices/{id}/signal:
 *   put:
 *     summary: Update device signal (heartbeat)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batteryLevel:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Current battery level
 *                 example: 75
 *     responses:
 *       200:
 *         description: Device signal updated successfully
 *       404:
 *         description: Device not found
 */
router.put("/:id/signal", deviceController.updateSignal);

/**
 * @swagger
 * /api/devices/{id}/error:
 *   post:
 *     summary: Add error log to device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - errorCode
 *               - description
 *             properties:
 *               errorCode:
 *                 type: string
 *                 description: Error code identifier
 *                 example: SENSOR_MALFUNCTION
 *               description:
 *                 type: string
 *                 description: Detailed error description
 *                 example: Temperature sensor not responding
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 example: high
 *     responses:
 *       200:
 *         description: Error logged successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Device not found
 */
router.post("/:id/error", deviceController.addError);

/**
 * @swagger
 * /api/devices/{id}/maintenance:
 *   post:
 *     summary: Add maintenance record to device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - technicianId
 *               - notes
 *             properties:
 *               action:
 *                 type: string
 *                 description: Maintenance action performed
 *                 example: Battery replacement
 *               technicianId:
 *                 type: string
 *                 description: ID of technician who performed maintenance
 *                 example: 6543210abc123def456791
 *               notes:
 *                 type: string
 *                 description: Detailed maintenance notes
 *                 example: Replaced battery, tested all sensors
 *               workOrderId:
 *                 type: string
 *                 description: Associated work order ID (optional)
 *                 example: 6543210abc123def456792
 *     responses:
 *       200:
 *         description: Maintenance record added successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Device not found
 */
router.post("/:id/maintenance", deviceController.addMaintenance);

/**
 * @swagger
 * /api/devices/{id}/decommission:
 *   put:
 *     summary: Decommission device (remove from service)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device decommissioned successfully
 *       400:
 *         description: Device already decommissioned
 *       404:
 *         description: Device not found
 */
router.put("/:id/decommission", deviceController.decommissionDevice);

/**
 * @swagger
 * /api/devices/{id}/reactivate:
 *   put:
 *     summary: Reactivate device
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               binId:
 *                 type: string
 *                 description: Bin ID to associate with device (optional)
 *                 example: 6543210abc123def456789
 *     responses:
 *       200:
 *         description: Device reactivated successfully
 *       400:
 *         description: Decommissioned devices cannot be reactivated
 *       404:
 *         description: Device or bin not found
 */
router.put("/:id/reactivate", deviceController.reactivateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete device (Admin only)
 *     tags: [Devices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete("/:id", deviceController.deleteDevice);

module.exports = router;
