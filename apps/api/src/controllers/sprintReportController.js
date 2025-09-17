const SprintReport = require('../models/SprintReport');
const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/error');
const { hasPermission } = require('../middleware/permissions');

// Generate automated sprint report
const generateSprintReport = asyncHandler(async (req, res) => {
  const { sprintId } = req.params;
  
  // Check permissions
  if (!hasPermission(req.user.role, 'sprints.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  // Get sprint details
  const sprint = await Sprint.findById(sprintId).populate('project');
  if (!sprint) {
    return res.status(404).json({ message: 'Sprint not found' });
  }

  // Get all issues in the sprint
  const issues = await Issue.find({ 
    sprint: sprintId,
    project: sprint.project._id 
  }).populate('assignee', 'name email');

  // Calculate basic statistics
  const totalIssues = issues.length;
  const completedIssues = issues.filter(issue => 
    issue.status === 'released' || issue.status === 'done' || issue.status === 'completed'
  ).length;
  const inProgressIssues = issues.filter(issue => 
    issue.status === 'development' || issue.status === 'in_progress' || issue.status === 'testing'
  ).length;
  const notStartedIssues = issues.filter(issue => 
    issue.status === 'backlog' || issue.status === 'todo' || issue.status === 'planning'
  ).length;

  // Calculate story points
  const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
  const completedStoryPoints = issues
    .filter(issue => issue.status === 'released' || issue.status === 'done' || issue.status === 'completed')
    .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

  // Calculate effort tracking
  const totalEstimatedHours = issues.reduce((sum, issue) => sum + (issue.estimate || 0), 0);
  const totalActualHours = issues.reduce((sum, issue) => {
    return sum + (issue.actual?.hours || 0);
  }, 0);

  // Issue type breakdown
  const issueTypeBreakdown = {};
  issues.forEach(issue => {
    const type = issue.type || 'unknown';
    if (!issueTypeBreakdown[type]) {
      issueTypeBreakdown[type] = {
        issueType: type,
        total: 0,
        completed: 0,
        storyPoints: 0,
        completedStoryPoints: 0
      };
    }
    
    issueTypeBreakdown[type].total++;
    issueTypeBreakdown[type].storyPoints += issue.storyPoints || 0;
    
    if (issue.status === 'released' || issue.status === 'done' || issue.status === 'completed') {
      issueTypeBreakdown[type].completed++;
      issueTypeBreakdown[type].completedStoryPoints += issue.storyPoints || 0;
    }
  });

  // Status breakdown
  const statusBreakdown = {};
  issues.forEach(issue => {
    const status = issue.status || 'unknown';
    if (!statusBreakdown[status]) {
      statusBreakdown[status] = {
        status: status,
        count: 0,
        storyPoints: 0
      };
    }
    statusBreakdown[status].count++;
    statusBreakdown[status].storyPoints += issue.storyPoints || 0;
  });

  // Team performance
  const teamMembers = {};
  issues.forEach(issue => {
    if (issue.assignee) {
      const memberId = issue.assignee._id.toString();
      if (!teamMembers[memberId]) {
        teamMembers[memberId] = {
          member: issue.assignee._id,
          issuesAssigned: 0,
          issuesCompleted: 0,
          storyPointsCompleted: 0,
          hoursSpent: 0
        };
      }
      
      teamMembers[memberId].issuesAssigned++;
      teamMembers[memberId].hoursSpent += issue.actual?.hours || 0;
      
      if (issue.status === 'released' || issue.status === 'done' || issue.status === 'completed') {
        teamMembers[memberId].issuesCompleted++;
        teamMembers[memberId].storyPointsCompleted += issue.storyPoints || 0;
      }
    }
  });

  // Calculate sprint health metrics
  const completionRate = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
  const effortAccuracy = totalEstimatedHours > 0 ? 
    Math.abs((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100 : 0;

  // Generate insights
  const insights = [];
  
  // Velocity insight
  if (completedStoryPoints > 0) {
    insights.push({
      type: 'velocity',
      title: 'Sprint Velocity',
      description: `Completed ${completedStoryPoints} story points`,
      value: completedStoryPoints,
      trend: completedStoryPoints >= totalStoryPoints * 0.8 ? 'positive' : 'negative'
    });
  }

  // Effort insight
  if (totalEstimatedHours > 0) {
    const effortVariance = ((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100;
    insights.push({
      type: 'effort',
      title: 'Effort Accuracy',
      description: `Estimated ${totalEstimatedHours}h, spent ${totalActualHours}h`,
      value: Math.abs(effortVariance),
      trend: Math.abs(effortVariance) < 20 ? 'positive' : 'negative'
    });
  }

  // Completion insight
  insights.push({
    type: 'completion',
    title: 'Sprint Completion',
    description: `Completed ${completedIssues} of ${totalIssues} issues`,
    value: completionRate,
    trend: completionRate >= 80 ? 'positive' : completionRate >= 60 ? 'neutral' : 'negative'
  });

  // Create sprint report
  const sprintReport = new SprintReport({
    sprint: sprintId,
    project: sprint.project._id,
    sprintName: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    actualEndDate: sprint.status === 'completed' ? new Date() : null,
    
    totalIssues,
    completedIssues,
    inProgressIssues,
    notStartedIssues,
    
    totalStoryPoints,
    completedStoryPoints,
    velocity: completedStoryPoints,
    
    totalEstimatedHours,
    totalActualHours,
    effortVariance: totalActualHours - totalEstimatedHours,
    
    issueTypeBreakdown: Object.values(issueTypeBreakdown),
    statusBreakdown: Object.values(statusBreakdown),
    teamMembers: Object.values(teamMembers),
    
    sprintHealth: {
      completionRate,
      velocityTrend: 'stable', // Could be calculated based on historical data
      effortAccuracy: 100 - effortAccuracy,
      scopeChange: 0, // Could track issues added/removed during sprint
      blockers: 0 // Could track blocked issues
    },
    
    generatedAt: new Date(),
    generatedBy: req.user._id,
    reportType: 'completion',
    insights
  });

  await sprintReport.save();

  res.json({
    message: 'Sprint report generated successfully',
    report: sprintReport
  });
});

// Get sprint reports for a project
const getSprintReports = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 10, page = 1 } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'sprints.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const skip = (page - 1) * limit;
  
  const reports = await SprintReport.find({ project: projectId })
    .populate('sprint', 'name startDate endDate status')
    .populate('generatedBy', 'name email')
    .sort({ generatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await SprintReport.countDocuments({ project: projectId });

  res.json({
    reports,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / limit),
      total
    }
  });
});

// Get specific sprint report
const getSprintReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  // Check permissions
  if (!hasPermission(req.user.role, 'sprints.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const report = await SprintReport.findById(reportId)
    .populate('sprint', 'name startDate endDate status')
    .populate('project', 'name key')
    .populate('generatedBy', 'name email')
    .populate('teamMembers.member', 'name email');

  if (!report) {
    return res.status(404).json({ message: 'Sprint report not found' });
  }

  res.json({ report });
});

// Get velocity trends for a project
const getVelocityTrends = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { months = 6 } = req.query;

  // Check permissions
  if (!hasPermission(req.user.role, 'sprints.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const reports = await SprintReport.find({
    project: projectId,
    generatedAt: { $gte: startDate },
    reportType: 'completion'
  })
  .populate('sprint', 'name startDate endDate')
  .sort({ generatedAt: 1 })
  .select('velocity sprintName startDate endDate generatedAt');

  // Calculate average velocity
  const velocities = reports.map(r => r.velocity);
  const averageVelocity = velocities.length > 0 ? 
    velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;

  res.json({
    reports,
    averageVelocity,
    trend: reports.length >= 2 ? 
      (reports[reports.length - 1].velocity > reports[0].velocity ? 'increasing' : 'decreasing') : 
      'stable'
  });
});

module.exports = {
  generateSprintReport,
  getSprintReports,
  getSprintReport,
  getVelocityTrends
};
