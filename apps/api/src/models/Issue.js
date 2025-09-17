'use strict';

const mongoose = require('mongoose');

const IssueSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, default: 'task' }, // Dynamic issue types from project config
    status: {
      type: String,
      enum: [
        'backlog',
        'analysis_ready',
        'analysis',
        'analysis_requirements',
        'development',
        'code_review',
        'qa',
        'deployment',
        'acceptance',
        'released',
        // legacy statuses kept for backward compatibility
        'todo',
        'in_progress',
        'in_review',
        'done'
      ],
      default: 'backlog'
    },
    priority: { type: String, default: 'medium' }, // Dynamic priorities from project config
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint' },
    storyPoints: { type: Number, default: 0 },
    tags: [{ type: String }],
    
    // Per-issue daily status indicator (green/yellow/white)
    dailyStatus: { type: String, enum: ['green', 'yellow', 'white'], required: false },
    
    // Parent-child relationships
    parentIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    childIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Issue' }],
    
    // Custom fields
    acceptanceCriteria: { type: String }, // Only for stories
    testPlan: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    estimate: { type: Number }, // in hours
    actual: {
      date: { type: Date },
      hours: { type: Number }
    },
    
    // Additional metadata
    linkedIssues: [{
      issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
      linkType: { type: String, enum: ['blocks', 'is_blocked_by', 'relates_to', 'duplicates', 'is_duplicated_by'] }
    }]
  },
  { timestamps: true }
);

// Virtual for checking if issue is a subtask
IssueSchema.virtual('isSubtask').get(function() {
  return this.type === 'subtask' || this.parentIssue;
});

// Virtual for getting parent issue key
IssueSchema.virtual('parentKey').get(function() {
  return this.parentIssue ? this.parentIssue.key : null;
});

// Method to add child issue
IssueSchema.methods.addChildIssue = function(childIssueId) {
  if (!this.childIssues.includes(childIssueId)) {
    this.childIssues.push(childIssueId);
  }
  return this.save();
};

// Method to remove child issue
IssueSchema.methods.removeChildIssue = function(childIssueId) {
  this.childIssues = this.childIssues.filter(id => !id.equals(childIssueId));
  return this.save();
};

// Method to link issues
IssueSchema.methods.linkIssue = function(issueId, linkType) {
  const existingLink = this.linkedIssues.find(link => link.issue.equals(issueId));
  if (existingLink) {
    existingLink.linkType = linkType;
  } else {
    this.linkedIssues.push({ issue: issueId, linkType });
  }
  return this.save();
};

// Method to unlink issues
IssueSchema.methods.unlinkIssue = function(issueId) {
  this.linkedIssues = this.linkedIssues.filter(link => !link.issue.equals(issueId));
  return this.save();
};

// Pre-save middleware to handle parent-child relationships
IssueSchema.pre('save', async function(next) {
  if (this.isModified('parentIssue') && this.parentIssue) {
    try {
      const parent = await this.constructor.findById(this.parentIssue);
      if (parent) {
        await parent.addChildIssue(this._id);
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Validation middleware to check issue type and priority against project configuration
IssueSchema.pre('validate', async function(next) {
  try {
    if (this.isNew || this.isModified('type') || this.isModified('priority') || this.isModified('project')) {
      const ProjectConfig = require('./ProjectConfig');
      const projectConfig = await ProjectConfig.findOne({ project: this.project });
      
      if (projectConfig) {
        // Validate issue type
        if (this.type) {
          const validIssueType = projectConfig.issueTypes.find(
            it => it.name === this.type && it.isActive
          );
          if (!validIssueType) {
            const availableTypes = projectConfig.issueTypes
              .filter(it => it.isActive)
              .map(it => it.name)
              .join(', ');
            return next(new Error(`Invalid issue type '${this.type}'. Available types: ${availableTypes}`));
          }
        }
        
        // Validate priority
        if (this.priority) {
          const validPriority = projectConfig.priorities.find(
            p => p.name === this.priority && p.isActive
          );
          if (!validPriority) {
            const availablePriorities = projectConfig.priorities
              .filter(p => p.isActive)
              .map(p => p.name)
              .join(', ');
            return next(new Error(`Invalid priority '${this.priority}'. Available priorities: ${availablePriorities}`));
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Issue', IssueSchema);


