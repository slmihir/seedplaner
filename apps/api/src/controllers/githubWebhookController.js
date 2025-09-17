const GitHubWebhook = require('../models/GitHubWebhook');
const GitHubIntegration = require('../models/GitHubIntegration');
const Issue = require('../models/Issue');
const { asyncHandler } = require('../middleware/error');
const crypto = require('crypto');

// Verify GitHub webhook signature
const verifySignature = (payload, signature, secret) => {
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Process GitHub webhook
const processWebhook = asyncHandler(async (req, res) => {
  const { integrationId } = req.params;
  const signature = req.get('X-Hub-Signature-256');
  const eventType = req.get('X-GitHub-Event');
  const deliveryId = req.get('X-GitHub-Delivery');

  // Find the integration
  const integration = await GitHubIntegration.findById(integrationId);
  if (!integration) {
    return res.status(404).json({ message: 'Integration not found' });
  }

  if (!integration.isActive) {
    return res.status(200).json({ message: 'Integration is inactive' });
  }

  // Verify webhook signature
  const payload = JSON.stringify(req.body);
  if (!verifySignature(payload, signature, integration.webhookSecret)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Create webhook record
  const webhook = new GitHubWebhook({
    eventId: deliveryId,
    eventType: eventType,
    action: req.body.action || 'unknown',
    repository: {
      id: req.body.repository?.id,
      name: req.body.repository?.name,
      fullName: req.body.repository?.full_name,
      owner: req.body.repository?.owner?.login
    },
    project: integration.project,
    githubIntegration: integrationId,
    rawPayload: req.body,
    headers: req.headers,
    status: 'received'
  });

  // Extract relevant data based on event type
  switch (eventType) {
    case 'pull_request':
      webhook.pullRequest = {
        id: req.body.pull_request?.id,
        number: req.body.pull_request?.number,
        title: req.body.pull_request?.title,
        body: req.body.pull_request?.body,
        state: req.body.pull_request?.state,
        merged: req.body.pull_request?.merged,
        mergeable: req.body.pull_request?.mergeable,
        head: {
          ref: req.body.pull_request?.head?.ref,
          sha: req.body.pull_request?.head?.sha
        },
        base: {
          ref: req.body.pull_request?.base?.ref,
          sha: req.body.pull_request?.base?.sha
        }
      };
      break;

    case 'issues':
      webhook.issue = {
        id: req.body.issue?.id,
        number: req.body.issue?.number,
        title: req.body.issue?.title,
        body: req.body.issue?.body,
        state: req.body.issue?.state,
        labels: req.body.issue?.labels?.map(label => label.name) || [],
        assignees: req.body.issue?.assignees?.map(assignee => assignee.login) || []
      };
      break;

    case 'pull_request_review':
      webhook.review = {
        id: req.body.review?.id,
        state: req.body.review?.state,
        body: req.body.review?.body,
        user: req.body.review?.user?.login
      };
      webhook.pullRequest = {
        id: req.body.pull_request?.id,
        number: req.body.pull_request?.number,
        title: req.body.pull_request?.title,
        state: req.body.pull_request?.state
      };
      break;

    case 'push':
      webhook.commits = req.body.commits?.map(commit => ({
        id: commit.id,
        message: commit.message,
        author: {
          name: commit.author?.name,
          email: commit.author?.email
        },
        url: commit.url
      })) || [];
      break;

    case 'check_run':
      webhook.checkRun = {
        id: req.body.check_run?.id,
        name: req.body.check_run?.name,
        status: req.body.check_run?.status,
        conclusion: req.body.check_run?.conclusion,
        url: req.body.check_run?.html_url
      };
      break;
  }

  await webhook.save();

  // Process the webhook asynchronously
  processWebhookAsync(webhook._id).catch(error => {
    console.error('Error processing webhook:', error);
  });

  res.status(200).json({ message: 'Webhook received successfully' });
});

// Process webhook asynchronously
const processWebhookAsync = async (webhookId) => {
  try {
    const webhook = await GitHubWebhook.findById(webhookId)
      .populate('githubIntegration')
      .populate('project');

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    webhook.status = 'processing';
    await webhook.save();

    const actions = [];
    const integration = webhook.githubIntegration;

    // Process based on event type and action
    switch (webhook.eventType) {
      case 'pull_request':
        actions.push(...await processPullRequestEvent(webhook, integration));
        break;
      case 'issues':
        actions.push(...await processIssueEvent(webhook, integration));
        break;
      case 'pull_request_review':
        actions.push(...await processReviewEvent(webhook, integration));
        break;
      case 'push':
        actions.push(...await processPushEvent(webhook, integration));
        break;
      case 'check_run':
        actions.push(...await processCheckRunEvent(webhook, integration));
        break;
    }

    // Update webhook with actions taken
    webhook.actions = actions;
    webhook.status = actions.length > 0 ? 'processed' : 'ignored';
    webhook.processedAt = new Date();
    await webhook.save();

    // Update integration last sync time
    integration.lastSyncAt = new Date();
    integration.syncStatus = 'active';
    await integration.save();

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    const webhook = await GitHubWebhook.findById(webhookId);
    if (webhook) {
      webhook.status = 'failed';
      webhook.errorMessage = error.message;
      await webhook.save();
    }

    // Update integration error status
    const integration = await GitHubIntegration.findById(webhook.githubIntegration);
    if (integration) {
      integration.syncStatus = 'error';
      integration.lastError = {
        message: error.message,
        timestamp: new Date(),
        event: webhook.eventType
      };
      await integration.save();
    }
  }
};

// Process pull request events
const processPullRequestEvent = async (webhook, integration) => {
  const actions = [];
  const { pullRequest, action } = webhook;

  if (!pullRequest) return actions;

  // Find related issue by PR title or branch name
  const issue = await findRelatedIssue(pullRequest, integration.project);

  if (!issue) return actions;

  // Apply workflow mappings based on action
  const mapping = findWorkflowMapping(integration, 'pull_request', action);
  if (!mapping) return actions;

  // Transition issue status
  if (issue.status !== mapping.projectStatus) {
    const oldStatus = issue.status;
    issue.status = mapping.projectStatus;
    await issue.save();

    actions.push({
      type: 'issue_transition',
      description: `Transitioned issue ${issue.key} from ${oldStatus} to ${mapping.projectStatus} due to PR ${action}`,
      issueId: issue._id,
      fromStatus: oldStatus,
      toStatus: mapping.projectStatus
    });
  }

  return actions;
};

// Process issue events
const processIssueEvent = async (webhook, integration) => {
  const actions = [];
  const { issue: githubIssue, action } = webhook;

  if (!githubIssue) return actions;

  // Find related issue by GitHub issue number
  const issue = await Issue.findOne({
    project: integration.project,
    githubIssueNumber: githubIssue.number
  });

  if (!issue) return actions;

  // Apply workflow mappings
  const mapping = findWorkflowMapping(integration, 'issue', action);
  if (!mapping) return actions;

  // Transition issue status
  if (issue.status !== mapping.projectStatus) {
    const oldStatus = issue.status;
    issue.status = mapping.projectStatus;
    await issue.save();

    actions.push({
      type: 'issue_transition',
      description: `Transitioned issue ${issue.key} from ${oldStatus} to ${mapping.projectStatus} due to GitHub issue ${action}`,
      issueId: issue._id,
      fromStatus: oldStatus,
      toStatus: mapping.projectStatus
    });
  }

  return actions;
};

// Process review events
const processReviewEvent = async (webhook, integration) => {
  const actions = [];
  const { review, pullRequest, action } = webhook;

  if (!review || !pullRequest) return actions;

  // Find related issue
  const issue = await findRelatedIssue(pullRequest, integration.project);
  if (!issue) return actions;

  // Apply workflow mappings for review events
  const mapping = findWorkflowMapping(integration, 'review', action);
  if (!mapping) return actions;

  // Transition issue status
  if (issue.status !== mapping.projectStatus) {
    const oldStatus = issue.status;
    issue.status = mapping.projectStatus;
    await issue.save();

    actions.push({
      type: 'issue_transition',
      description: `Transitioned issue ${issue.key} from ${oldStatus} to ${mapping.projectStatus} due to review ${review.state}`,
      issueId: issue._id,
      fromStatus: oldStatus,
      toStatus: mapping.projectStatus
    });
  }

  return actions;
};

// Process push events
const processPushEvent = async (webhook, integration) => {
  const actions = [];
  const { commits } = webhook;

  if (!commits || commits.length === 0) return actions;

  // Process each commit for issue references
  for (const commit of commits) {
    const issueNumbers = extractIssueNumbers(commit.message);
    
    for (const issueNumber of issueNumbers) {
      const issue = await Issue.findOne({
        project: integration.project,
        key: new RegExp(`.*-${issueNumber}$`)
      });

      if (issue) {
        // Apply workflow mappings for commit events
        const mapping = findWorkflowMapping(integration, 'commit', 'pushed');
        if (mapping && issue.status !== mapping.projectStatus) {
          const oldStatus = issue.status;
          issue.status = mapping.projectStatus;
          await issue.save();

          actions.push({
            type: 'issue_transition',
            description: `Transitioned issue ${issue.key} from ${oldStatus} to ${mapping.projectStatus} due to commit`,
            issueId: issue._id,
            fromStatus: oldStatus,
            toStatus: mapping.projectStatus
          });
        }
      }
    }
  }

  return actions;
};

// Process check run events
const processCheckRunEvent = async (webhook, integration) => {
  const actions = [];
  const { checkRun } = webhook;

  if (!checkRun) return actions;

  // Find related issue by branch name or commit message
  // This would need to be implemented based on your specific workflow
  // For now, we'll just log the check run event

  actions.push({
    type: 'no_action',
    description: `Check run ${checkRun.conclusion} for ${checkRun.name}`,
    timestamp: new Date()
  });

  return actions;
};

// Helper function to find related issue
const findRelatedIssue = async (pullRequest, projectId) => {
  // Try to find by PR title containing issue key
  const titleMatch = pullRequest.title.match(/([A-Z]+-\d+)/);
  if (titleMatch) {
    const issue = await Issue.findOne({
      project: projectId,
      key: titleMatch[1]
    });
    if (issue) return issue;
  }

  // Try to find by branch name containing issue key
  const branchMatch = pullRequest.head.ref.match(/([A-Z]+-\d+)/);
  if (branchMatch) {
    const issue = await Issue.findOne({
      project: projectId,
      key: branchMatch[1]
    });
    if (issue) return issue;
  }

  // Try to find by GitHub issue number if stored
  if (pullRequest.number) {
    const issue = await Issue.findOne({
      project: projectId,
      githubIssueNumber: pullRequest.number
    });
    if (issue) return issue;
  }

  return null;
};

// Helper function to find workflow mapping
const findWorkflowMapping = (integration, event, action) => {
  if (!integration.workflowMappings) return null;

  for (const mapping of integration.workflowMappings) {
    for (const statusMapping of mapping.githubStatusMappings) {
      if (statusMapping.githubEvent === event && 
          (statusMapping.githubStatus === action || statusMapping.githubStatus === 'any')) {
        return statusMapping;
      }
    }
  }

  return null;
};

// Helper function to extract issue numbers from commit message
const extractIssueNumbers = (message) => {
  const issuePattern = /(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#?(\d+)/gi;
  const matches = message.match(issuePattern);
  return matches ? matches.map(match => match.replace(/\D/g, '')) : [];
};

module.exports = {
  processWebhook
};
