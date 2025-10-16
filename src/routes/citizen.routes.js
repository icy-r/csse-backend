const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizen.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Citizen
 *   description: Citizen/Resident operations
 */

/**
 * @swagger
 * /api/citizen/requests:
 *   post:
 *     summary: Create waste pickup request
 *     tags: [Citizen]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - wasteType
 *               - quantity
 *               - address
 *               - preferredDate
 *             properties:
 *               userId:
 *                 type: string
 *               wasteType:
 *                 type: string
 *                 enum: [household, bulky, e-waste, recyclable]
 *               quantity:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               preferredDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/requests', citizenController.createRequest);

/**
 * @swagger
 * /api/citizen/requests:
 *   get:
 *     summary: Get user's waste requests with filtering
 *     tags: [Citizen]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Requests retrieved successfully
 */
router.get('/requests', buildQuery(['userId', 'status', 'wasteType', 'createdAt']), citizenController.getRequests);

/**
 * @swagger
 * /api/citizen/requests/{id}:
 *   get:
 *     summary: Get request details by ID
 *     tags: [Citizen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details retrieved
 *       404:
 *         description: Request not found
 */
router.get('/requests/:id', citizenController.getRequestById);

/**
 * @swagger
 * /api/citizen/requests/{id}/track:
 *   get:
 *     summary: Track specific request with detailed timeline
 *     tags: [Citizen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request details with timeline
 *       404:
 *         description: Request not found
 */
router.get('/requests/:id/track', citizenController.trackRequest);

/**
 * @swagger
 * /api/citizen/requests/{id}/payment:
 *   put:
 *     summary: Record payment for request
 *     tags: [Citizen]
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 */
router.put('/requests/:id/payment', citizenController.updatePayment);

/**
 * @swagger
 * /api/citizen/requests/{id}/cancel:
 *   put:
 *     summary: Cancel waste request
 *     tags: [Citizen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request cancelled successfully
 */
router.put('/requests/:id/cancel', citizenController.cancelRequest);

/**
 * @swagger
 * /api/citizen/bins/nearby:
 *   get:
 *     summary: Find nearby smart bins
 *     tags: [Citizen]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 2000
 *       - in: query
 *         name: binType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Nearby bins retrieved
 */
router.get('/bins/nearby', citizenController.getNearbyBins);

module.exports = router;

