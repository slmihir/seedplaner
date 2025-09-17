const mongoose = require('mongoose');

const SprintReportSchema = new mongoose.Schema({
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  
  // Sprint Summary
  sprintName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  actualEndDate: { type: Date }, // When sprint actually ended
  
  // Issue Statistics
  totalIssues: { type: Number, default: 0 },
  completedIssues: { type: Number, default: 0 },
  inProgressIssues: { type: Number, default: 0 },
  notStartedIssues: { type: Number, default: 0 },
  
  // Story Points
  totalStoryPoints: { type: Number, default: 0 },
  completedStoryPoints: { type: Number, default: 0 },
  velocity: { type: Number, default: 0 }, // Story points completed
  
  // Effort Tracking
  totalEstimatedHours: { type: Number, default: 0 },
  totalActualHours: { type: Number, default: 0 },
  effortVariance: { type: Number, default: 0 }, // actual - estimated
  
  // Issue Type Breakdown
  issueTypeBreakdown: [{
    issueType: { type: String, required: true },
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    storyPoints: { type: Number, default: 0 },
    completedStoryPoints: { type: Number, default: 0 }
  }],
  
  // Status Breakdown
  statusBreakdown: [{
    status: { type: String, required: true },
    count: { type: Number, default: 0 },
    storyPoints: { type: Number, default: 0 }
  }],
  
  // Team Performance
  teamMembers: [{
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuesAssigned: { type: Number, default: 0 },
    issuesCompleted: { type: Number, default: 0 },
    storyPointsCompleted: { type: Number, default: 0 },
    hoursSpent: { type: Number, default: 0 }
  }],
  
  // Sprint Health Metrics
  sprintHealth: {
    completionRate: { type: Number, default: 0 }, // Percentage
    velocityTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
    effortAccuracy: { type: Number, default: 0 }, // How close estimates were to actual
    scopeChange: { type: Number, default: 0 }, // Issues added/removed during sprint
    blockers: { type: Number, default: 0 } // Issues blocked during sprint
  },
  
  // Report Metadata
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportType: { 
    type: String, 
    enum: ['completion', 'mid_sprint', 'custom'], 
    default: 'completion' 
  },
  
  // Additional Insights
  insights: [{
    type: { type: String, required: true }, // 'velocity', 'effort', 'team', 'scope'
    title: { type: String, required: true },
    description: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed }, // Can be number, string, etc.
    trend: { type: String, enum: ['positive', 'negative', 'neutral'] }
  }]
}, { timestamps: true });

// Indexes for efficient querying
SprintReportSchema.index({ sprint: 1 });
SprintReportSchema.index({ project: 1 });
SprintReportSchema.index({ generatedAt: -1 });
SprintReportSchema.index({ sprint: 1, reportType: 1 });

module.exports = mongoose.model('SprintReport', SprintReportSchema);
