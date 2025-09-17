const express = require('express');
const router = express.Router();
const { generateSprintReport, getSprintReports, getSprintReport, getVelocityTrends } = require('../controllers/sprintReportController');
const { authenticate } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Generate sprint report
router.post('/generate/:sprintId', generateSprintReport);

// Get sprint reports for a project
router.get('/project/:projectId', getSprintReports);

// Get velocity trends for a project
router.get('/velocity/:projectId', getVelocityTrends);

// Get specific sprint report
router.get('/:reportId', getSprintReport);

module.exports = router;
