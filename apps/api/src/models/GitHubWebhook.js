const mongoose = require('mongoose');

const GitHubWebhookSchema = new mongoose.Schema({
  // GitHub Event Information
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['push', 'pull_request', 'issues', 'pull_request_review', 'check_run']
  },
  action: {
    type: String,
    required: true,
    trim: true // e.g., "opened", "closed", "merged", "approved"
  },

  // Repository Information
  repository: {
    id: Number,
    name: String,
    fullName: String,
    owner: String
  },

  // Issue/Pull Request Information
  issue: {
    id: Number,
    number: Number,
    title: String,
    body: String,
    state: String,
    labels: [String],
    assignees: [String]
  },

  pullRequest: {
    id: Number,
    number: Number,
    title: String,
    body: String,
    state: String,
    merged: Boolean,
    mergeable: Boolean,
    head: {
      ref: String,
      sha: String
    },
    base: {
      ref: String,
      sha: String
    }
  },

  // Commit Information
  commits: [{
    id: String,
    message: String,
    author: {
      name: String,
      email: String
    },
    url: String
  }],

  // Review Information
  review: {
    id: Number,
    state: String, // "approved", "changes_requested", "commented"
    body: String,
    user: String
  },

  // Check Run Information
  checkRun: {
    id: Number,
    name: String,
    status: String, // "queued", "in_progress", "completed"
    conclusion: String, // "success", "failure", "neutral", "cancelled", "timed_out", "action_required"
    url: String
  },

  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  githubIntegration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GitHubIntegration'
  },

  // Processing Status
  status: {
    type: String,
    enum: ['received', 'processing', 'processed', 'failed', 'ignored'],
    default: 'received'
  },
  processedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },

  // Actions Taken
  actions: [{
    type: {
      type: String,
      enum: ['issue_transition', 'issue_created', 'issue_updated', 'comment_added', 'no_action']
    },
    description: String,
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    fromStatus: String,
    toStatus: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Raw Webhook Data
  rawPayload: {
    type: mongoose.Schema.Types.Mixed
  },

  // Metadata
  receivedAt: {
    type: Date,
    default: Date.now
  },
  headers: {
    type: mongoose.Schema.Types.Mixed
  }
}, { timestamps: true });

// Indexes for efficient querying
GitHubWebhookSchema.index({ eventId: 1 });
GitHubWebhookSchema.index({ eventType: 1, action: 1 });
GitHubWebhookSchema.index({ project: 1 });
GitHubWebhookSchema.index({ status: 1 });
GitHubWebhookSchema.index({ receivedAt: -1 });

// Virtual for event summary
GitHubWebhookSchema.virtual('eventSummary').get(function() {
  return `${this.eventType}:${this.action} - ${this.repository?.fullName || 'Unknown'}`;
});

// Static method to find recent webhooks for a project
GitHubWebhookSchema.statics.findRecentByProject = function(projectId, limit = 50) {
  return this.find({ project: projectId })
    .sort({ receivedAt: -1 })
    .limit(limit);
};

// Static method to find failed webhooks
GitHubWebhookSchema.statics.findFailed = function(limit = 100) {
  return this.find({ status: 'failed' })
    .sort({ receivedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('GitHubWebhook', GitHubWebhookSchema);
