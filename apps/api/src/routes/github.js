const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createIntegration,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  testConnection,
  getWebhookEvents,
  retryWebhook,
  getIntegrationStats
} = require('../controllers/githubController');
const { processWebhook } = require('../controllers/githubWebhookController');

// Webhook endpoint (no authentication required - uses signature verification)
router.post('/webhook/:integrationId', processWebhook);

// Protected routes (require authentication)
router.use(authenticate);

// Integration management
router.post('/integration/:projectId', createIntegration);
router.get('/integration/:projectId', getIntegration);
router.patch('/integration/:projectId', updateIntegration);
router.delete('/integration/:projectId', deleteIntegration);

// Connection testing
router.post('/test-connection/:projectId', testConnection);

// Webhook management
router.get('/webhooks/:projectId', getWebhookEvents);
router.post('/webhooks/:webhookId/retry', retryWebhook);

// Statistics
router.get('/stats/:projectId', getIntegrationStats);

module.exports = router;
