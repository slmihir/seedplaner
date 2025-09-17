const mongoose = require('mongoose');

const GitHubIntegrationSchema = new mongoose.Schema({
  // Project Association
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  // GitHub Repository Configuration
  repository: {
    owner: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true // e.g., "owner/repo"
    }
  },

  // GitHub App/Token Configuration
  githubAppId: {
    type: String,
    trim: true
  },
  installationId: {
    type: String,
    trim: true
  },
  accessToken: {
    type: String,
    trim: true // Encrypted in production
  },

  // Workflow Configuration
  workflowMappings: [{
    issueType: {
      type: String,
      required: true,
      enum: ['bug', 'story', 'task', 'subtask']
    },
    githubStatusMappings: [{
      githubStatus: {
        type: String,
        required: true,
        trim: true // e.g., "open", "closed", "merged", "reviewed"
      },
      projectStatus: {
        type: String,
        required: true,
        trim: true // e.g., "backlog", "in_progress", "done"
      },
      githubEvent: {
        type: String,
        required: true,
        enum: ['pull_request', 'issue', 'commit', 'review', 'check_run']
      }
    }],
    branchMappings: [{
      branchPattern: {
        type: String,
        required: true,
        trim: true // e.g., "feature/*", "bugfix/*", "hotfix/*"
      },
      issueType: {
        type: String,
        required: true,
        enum: ['bug', 'story', 'task', 'subtask']
      }
    }]
  }],

  // Automation Settings
  autoTransition: {
    enabled: {
      type: Boolean,
      default: true
    },
    onPullRequestOpen: {
      type: Boolean,
      default: true
    },
    onPullRequestMerged: {
      type: Boolean,
      default: true
    },
    onIssueClosed: {
      type: Boolean,
      default: true
    },
    onReviewApproved: {
      type: Boolean,
      default: false
    }
  },

  // Webhook Configuration
  webhookSecret: {
    type: String,
    trim: true // For webhook verification
  },
  webhookUrl: {
    type: String,
    trim: true // The webhook endpoint URL
  },
  webhookEvents: [{
    type: String,
    enum: ['push', 'pull_request', 'issues', 'pull_request_review', 'check_run']
  }],

  // Status and Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date
  },
  syncStatus: {
    type: String,
    enum: ['active', 'error', 'paused'],
    default: 'active'
  },
  lastError: {
    message: String,
    timestamp: Date,
    event: String
  },

  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Indexes for efficient querying
GitHubIntegrationSchema.index({ project: 1 });
GitHubIntegrationSchema.index({ 'repository.fullName': 1 });
GitHubIntegrationSchema.index({ isActive: 1 });

// Virtual for repository URL
GitHubIntegrationSchema.virtual('repositoryUrl').get(function() {
  return `https://github.com/${this.repository.fullName}`;
});

// Pre-save middleware to ensure fullName is set
GitHubIntegrationSchema.pre('save', function(next) {
  if (this.repository.owner && this.repository.name && !this.repository.fullName) {
    this.repository.fullName = `${this.repository.owner}/${this.repository.name}`;
  }
  next();
});

module.exports = mongoose.model('GitHubIntegration', GitHubIntegrationSchema);
