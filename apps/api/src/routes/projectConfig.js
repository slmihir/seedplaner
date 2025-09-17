const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const {
  getProjectConfig,
  updateProjectConfig,
  initializeDefaultConfig,
  getFieldTypes,
  getIssueTypes,
  getPriorities,
  syncWorkflowToSystemConfig
} = require('../controllers/projectConfigController');

// Get available field types (must come before parameterized routes)
router.get('/field-types', authenticate, asyncHandler(getFieldTypes));

// Get available issue types for a project
router.get('/:projectId/issue-types', authenticate, asyncHandler(getIssueTypes));

// Get available priorities for a project
router.get('/:projectId/priorities', authenticate, asyncHandler(getPriorities));

// Get project configuration
router.get('/:projectId', authenticate, asyncHandler(getProjectConfig));

// Update project configuration
router.patch('/:projectId', authenticate, asyncHandler(updateProjectConfig));

// Initialize default configuration
router.post('/:projectId/initialize', authenticate, asyncHandler(initializeDefaultConfig));

// Sync workflow to system configuration
router.post('/:projectId/sync-workflow', authenticate, asyncHandler(syncWorkflowToSystemConfig));

// Temporary workflow template routes for testing
router.get('/workflow-templates-test', authenticate, (req, res) => {
  console.log('🔍 GET /workflow-templates-test route hit');
  res.json({ templates: [], message: 'Test route working' });
});

router.put('/workflow-templates-test', authenticate, (req, res) => {
  console.log('🔍 PUT /workflow-templates-test route hit');
  res.json({ message: 'Workflow template updated via test route' });
});

module.exports = router;
