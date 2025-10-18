const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const buildQuery = require('../middleware/queryBuilder');

/**
 * @swagger
 * tags:
 *   name: Issues
 *   description: Issue reporting and management operations
 */

/**
 * @swagger
 * /api/issues:
 *   post:
 *     summary: Report a new issue
 *     tags: [Issues]
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
 *                 description: ID of the route (optional)
 *               issueType:
 *                 type: string
 *                 enum: [blocked-access, bin-damaged, bin-overflow, safety-hazard, vehicle-issue, other]
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               location:
 *                 type: string
 *                 maxLength: 200
 *               stopIndex:
 *                 type: number
 *                 description: Index of the stop where issue occurred
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Optional, auto-assigned based on issue type if not provided
 *     responses:
 *       201:
 *         description: Issue reported successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Crew member or route not found
 */
router.post('/', issueController.createIssue);

/**
 * @swagger
 * /api/issues/stats:
 *   get:
 *     summary: Get issue statistics
 *     tags: [Issues]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         reported:
 *                           type: integer
 *                         inProgress:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                     byPriority:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                         high:
 *                           type: integer
 *                     byType:
 *                       type: object
 */
router.get('/stats', issueController.getIssueStats);

/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Get all issues with filters and pagination
 *     tags: [Issues]
 *     parameters:
 *       - in: query
 *         name: crewId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [reported, acknowledged, in-progress, resolved, closed]
 *       - in: query
 *         name: issueType
 *         schema:
 *           type: string
 *           enum: [blocked-access, bin-damaged, bin-overflow, safety-hazard, vehicle-issue, other]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "reportedAt:desc"
 *     responses:
 *       200:
 *         description: Issues retrieved successfully
 */
router.get('/', buildQuery(['status', 'issueType', 'priority']), issueController.getIssues);

/**
 * @swagger
 * /api/issues/{id}:
 *   get:
 *     summary: Get issue by ID
 *     tags: [Issues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue retrieved successfully
 *       404:
 *         description: Issue not found
 */
router.get('/:id', issueController.getIssueById);

/**
 * @swagger
 * /api/issues/{id}/status:
 *   put:
 *     summary: Update issue status
 *     tags: [Issues]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reported, acknowledged, in-progress, resolved, closed]
 *               resolvedBy:
 *                 type: string
 *                 description: User ID (required when status is resolved)
 *               resolution:
 *                 type: string
 *                 maxLength: 500
 *                 description: Resolution description (required when status is resolved)
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Issue not found
 */
router.put('/:id/status', issueController.updateIssueStatus);

/**
 * @swagger
 * /api/issues/{id}/priority:
 *   put:
 *     summary: Update issue priority
 *     tags: [Issues]
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
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *       400:
 *         description: Invalid priority
 *       404:
 *         description: Issue not found
 */
router.put('/:id/priority', issueController.updateIssuePriority);

/**
 * @swagger
 * /api/issues/{id}/comments:
 *   post:
 *     summary: Add comment to issue
 *     tags: [Issues]
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
 *               - userId
 *               - comment
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of user adding the comment
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Issue or user not found
 */
router.post('/:id/comments', issueController.addComment);

module.exports = router;

