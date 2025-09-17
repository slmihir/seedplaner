'use strict';

const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const SprintReport = require('../models/SprintReport');
const { asyncHandler } = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');

const createSprint = asyncHandler(async (req, res) => {
  const { name, goal, startDate, endDate, project } = req.body;
  if (!project) return res.status(400).json({ message: 'Project is required' });
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'Start date must be before end date' });
  }
  const duplicate = await Sprint.findOne({ project, name });
  if (duplicate) return res.status(409).json({ message: 'Sprint name already exists for this project' });
  const sprint = await Sprint.create({ name, goal, startDate, endDate, project });
  await logActivity({ action: 'sprint_created', actor: req.user.id, project, details: { name } });
  res.status(201).json({ sprint });
});

const listSprints = asyncHandler(async (req, res) => {
  const { project } = req.query;
  const filter = {};
  if (project) filter.project = project;
  const sprints = await Sprint.find(filter).sort({ createdAt: -1 });
  res.json({ sprints });
});

const getSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  res.json({ sprint });
});

const updateSprint = asyncHandler(async (req, res) => {
  const updates = (({ name, goal, startDate, endDate, isActive }) => ({ name, goal, startDate, endDate, isActive }))(req.body);
  if (updates.startDate && updates.endDate && new Date(updates.startDate) > new Date(updates.endDate)) {
    return res.status(400).json({ message: 'Start date must be before end date' });
  }
  // prevent duplicate names within project
  if (updates.name) {
    const existing = await Sprint.findOne({ _id: { $ne: req.params.id }, project: req.body.project, name: updates.name });
    if (existing) return res.status(409).json({ message: 'Sprint name already exists for this project' });
  }
  const sprint = await Sprint.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  await logActivity({ action: 'sprint_updated', actor: req.user.id, project: sprint.project, details: updates });
  res.json({ sprint });
});

const deleteSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findByIdAndDelete(req.params.id);
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  await logActivity({ action: 'sprint_deleted', actor: req.user.id, project: sprint.project, details: { id: sprint._id } });
  res.json({ message: 'Deleted' });
});

// Start a sprint (set active; ensure startDate is set)
const startSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findByIdAndUpdate(
    req.params.id,
    { isActive: true, startDate: new Date() },
    { new: true }
  );
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  await logActivity({ action: 'sprint_started', actor: req.user.id, project: sprint.project, details: { id: sprint._id } });
  res.json({ sprint });
});

// Complete a sprint (set inactive and completedAt; detach incomplete issues)
const completeSprint = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findByIdAndUpdate(
    req.params.id,
    { isActive: false, completedAt: new Date(), status: 'completed' },
    { new: true }
  );
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  
  // Move non-done items out of the sprint (keep their status, or set to backlog)
  await Issue.updateMany({ sprint: sprint._id, status: { $nin: ['done', 'released', 'completed'] } }, { $set: { sprint: null } });
  
  // Generate automated sprint report
  try {
    const issues = await Issue.find({ 
      sprint: sprint._id,
      project: sprint.project 
    }).populate('assignee', 'name email');

    // Calculate basic statistics
    const totalIssues = issues.length;
    const completedIssues = issues.filter(issue => 
      issue.status === 'released' || issue.status === 'done' || issue.status === 'completed'
    ).length;
    const totalStoryPoints = issues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);
    const completedStoryPoints = issues
      .filter(issue => issue.status === 'released' || issue.status === 'done' || issue.status === 'completed')
      .reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

    // Create sprint report
    const sprintReport = new SprintReport({
      sprint: sprint._id,
      project: sprint.project,
      sprintName: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      actualEndDate: new Date(),
      
      totalIssues,
      completedIssues,
      velocity: completedStoryPoints,
      totalStoryPoints,
      completedStoryPoints,
      
      generatedAt: new Date(),
      generatedBy: req.user._id,
      reportType: 'completion'
    });

    await sprintReport.save();
    console.log(`✅ Automated sprint report generated for sprint: ${sprint.name}`);
  } catch (error) {
    console.error('❌ Error generating sprint report:', error);
    // Don't fail the sprint completion if report generation fails
  }
  
  await logActivity({ action: 'sprint_completed', actor: req.user.id, project: sprint.project, details: { id: sprint._id } });
  res.json({ sprint });
});

// Summary: issues grouped by status, counts and basic progress
const getSprintSummary = asyncHandler(async (req, res) => {
  const sprint = await Sprint.findById(req.params.id);
  if (!sprint) return res.status(404).json({ message: 'Sprint not found' });
  const issues = await Issue.find({ sprint: sprint._id }).select('key title status type priority assignee');
  
  const groups = issues.reduce((acc, i) => {
    const k = i.status || 'backlog';
    acc[k] = acc[k] || [];
    acc[k].push(i);
    return acc;
  }, {});
  const total = issues.length;
  const done = issues.filter((i) => i.status === 'done' || i.status === 'released').length;
  res.json({
    sprint: {
      id: sprint._id,
      name: sprint.name,
      project: sprint.project,
      isActive: sprint.isActive,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      completedAt: sprint.completedAt
    },
    total,
    done,
    remaining: total - done,
    groups
  });
});

module.exports = { createSprint, listSprints, getSprint, updateSprint, deleteSprint, startSprint, completeSprint, getSprintSummary };


