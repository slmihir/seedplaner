const GitHubIntegration = require('../models/GitHubIntegration');
const GitHubWebhook = require('../models/GitHubWebhook');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/error');
const { hasPermission } = require('../middleware/permissions');
const crypto = require('crypto');

// GitHub API client configuration
const GITHUB_API_BASE = 'https://api.github.com';

// Create or update GitHub integration for a project
const createIntegration = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const integrationData = {
    ...req.body,
    project: projectId,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  };

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // Validate required fields
  if (!integrationData.repository.owner || !integrationData.repository.name) {
    return res.status(400).json({ message: 'Repository owner and name are required' });
  }

  // Set fullName if not provided
  if (!integrationData.repository.fullName) {
    integrationData.repository.fullName = `${integrationData.repository.owner}/${integrationData.repository.name}`;
  }

  // Generate webhook secret if not provided
  if (!integrationData.webhookSecret) {
    integrationData.webhookSecret = crypto.randomBytes(32).toString('hex');
  }

  const integration = await GitHubIntegration.findOneAndUpdate(
    { project: projectId },
    integrationData,
    { upsert: true, new: true, runValidators: true }
  );

  res.status(201).json({
    message: 'GitHub integration configured successfully',
    integration: {
      _id: integration._id,
      repository: integration.repository,
      workflowMappings: integration.workflowMappings,
      autoTransition: integration.autoTransition,
      isActive: integration.isActive,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/github/webhook/${integration._id}`
    }
  });
});

// Get GitHub integration for a project
const getIntegration = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const integration = await GitHubIntegration.findOne({ project: projectId });

  if (!integration) {
    return res.status(404).json({ message: 'GitHub integration not found' });
  }

  // Don't expose sensitive information
  const safeIntegration = {
    _id: integration._id,
    repository: integration.repository,
    workflowMappings: integration.workflowMappings,
    autoTransition: integration.autoTransition,
    isActive: integration.isActive,
    lastSyncAt: integration.lastSyncAt,
    syncStatus: integration.syncStatus,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/github/webhook/${integration._id}`
  };

  res.status(200).json({ integration: safeIntegration });
});

// Update GitHub integration
const updateIntegration = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const updateData = {
    ...req.body,
    lastModifiedBy: req.user._id
  };

  const integration = await GitHubIntegration.findOneAndUpdate(
    { project: projectId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!integration) {
    return res.status(404).json({ message: 'GitHub integration not found' });
  }

  res.status(200).json({
    message: 'GitHub integration updated successfully',
    integration: {
      _id: integration._id,
      repository: integration.repository,
      workflowMappings: integration.workflowMappings,
      autoTransition: integration.autoTransition,
      isActive: integration.isActive
    }
  });
});

// Delete GitHub integration
const deleteIntegration = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const integration = await GitHubIntegration.findOneAndDelete({ project: projectId });

  if (!integration) {
    return res.status(404).json({ message: 'GitHub integration not found' });
  }

  res.status(200).json({ message: 'GitHub integration deleted successfully' });
});

// Test GitHub connection
const testConnection = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const integration = await GitHubIntegration.findOne({ project: projectId });

  if (!integration) {
    return res.status(404).json({ message: 'GitHub integration not found' });
  }

  try {
    // Test GitHub API connection
    const headers = {
      'Authorization': `token ${integration.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SeedPlanner/1.0'
    };

    const response = await fetch(`${GITHUB_API_BASE}/repos/${integration.repository.fullName}`, {
      headers
    });

    if (response.ok) {
      const repoData = await response.json();
      
      // Update last sync time
      integration.lastSyncAt = new Date();
      integration.syncStatus = 'active';
      await integration.save();

      res.status(200).json({
        message: 'GitHub connection successful',
        repository: {
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description,
          private: repoData.private,
          defaultBranch: repoData.default_branch
        }
      });
    } else {
      integration.syncStatus = 'error';
      integration.lastError = {
        message: `GitHub API error: ${response.status}`,
        timestamp: new Date()
      };
      await integration.save();

      res.status(response.status).json({
        message: 'GitHub connection failed',
        error: `HTTP ${response.status}`
      });
    }
  } catch (error) {
    integration.syncStatus = 'error';
    integration.lastError = {
      message: error.message,
      timestamp: new Date()
    };
    await integration.save();

    res.status(500).json({
      message: 'GitHub connection test failed',
      error: error.message
    });
  }
});

// Get webhook events for a project
const getWebhookEvents = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 50, status } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  let query = { project: projectId };
  if (status) {
    query.status = status;
  }

  const webhooks = await GitHubWebhook.find(query)
    .sort({ receivedAt: -1 })
    .limit(parseInt(limit))
    .populate('githubIntegration', 'repository workflowMappings');

  res.status(200).json({
    message: 'Webhook events retrieved successfully',
    webhooks: webhooks.map(webhook => ({
      _id: webhook._id,
      eventType: webhook.eventType,
      action: webhook.action,
      eventSummary: webhook.eventSummary,
      repository: webhook.repository,
      status: webhook.status,
      receivedAt: webhook.receivedAt,
      processedAt: webhook.processedAt,
      actions: webhook.actions,
      errorMessage: webhook.errorMessage
    }))
  });
});

// Retry failed webhook
const retryWebhook = asyncHandler(async (req, res) => {
  const { webhookId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const webhook = await GitHubWebhook.findById(webhookId);

  if (!webhook) {
    return res.status(404).json({ message: 'Webhook not found' });
  }

  if (webhook.status !== 'failed') {
    return res.status(400).json({ message: 'Webhook is not in failed status' });
  }

  // Reset webhook status for retry
  webhook.status = 'received';
  webhook.errorMessage = null;
  await webhook.save();

  res.status(200).json({ message: 'Webhook queued for retry' });
});

// Get GitHub integration statistics
const getIntegrationStats = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const integration = await GitHubIntegration.findOne({ project: projectId });

  if (!integration) {
    return res.status(404).json({ message: 'GitHub integration not found' });
  }

  // Get webhook statistics
  const totalWebhooks = await GitHubWebhook.countDocuments({ project: projectId });
  const successfulWebhooks = await GitHubWebhook.countDocuments({ 
    project: projectId, 
    status: 'processed' 
  });
  const failedWebhooks = await GitHubWebhook.countDocuments({ 
    project: projectId, 
    status: 'failed' 
  });

  // Get recent activity
  const recentWebhooks = await GitHubWebhook.find({ project: projectId })
    .sort({ receivedAt: -1 })
    .limit(10)
    .select('eventType action status receivedAt');

  res.status(200).json({
    message: 'Integration statistics retrieved successfully',
    stats: {
      integration: {
        isActive: integration.isActive,
        syncStatus: integration.syncStatus,
        lastSyncAt: integration.lastSyncAt,
        repository: integration.repository.fullName
      },
      webhooks: {
        total: totalWebhooks,
        successful: successfulWebhooks,
        failed: failedWebhooks,
        successRate: totalWebhooks > 0 ? ((successfulWebhooks / totalWebhooks) * 100).toFixed(2) : 0
      },
      recentActivity: recentWebhooks
    }
  });
});

module.exports = {
  createIntegration,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  testConnection,
  getWebhookEvents,
  retryWebhook,
  getIntegrationStats
};
