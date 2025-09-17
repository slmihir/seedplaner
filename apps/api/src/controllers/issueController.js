'use strict';

const Issue = require('../models/Issue');
const Project = require('../models/Project');
const { asyncHandler } = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');
const { sendNotification } = require('../services/notificationService');

function buildIssueFilter(query, userId) {
  const filter = {};
  
  // Only add project filter if it's not "all" and is a valid ObjectId
  if (query.project && query.project !== 'all') {
    filter.project = query.project;
  }
  
  if (query.sprint) filter.sprint = query.sprint;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignee) filter.assignees = query.assignee;
  if (query.reporter) filter.reporter = query.reporter;
  if (query.q) filter.title = { $regex: query.q, $options: 'i' };
  if (query.tags) filter.tags = { $in: query.tags.split(',') };
  return filter;
}

const createIssue = asyncHandler(async (req, res) => {
  const { 
    title, description, type, status, priority, project: projectId, sprint, assignees, tags, storyPoints, dailyStatus,
    // Custom fields
    acceptanceCriteria, testPlan, startDate, endDate, estimate, actual
  } = req.body;
  
  const project = await Project.findById(projectId);
  if (!project) return res.status(400).json({ message: 'Invalid project' });
  
  // Validate assignees (if provided)
  if (assignees && assignees.length > 0) {
    const assigneeIds = Array.isArray(assignees) ? assignees : [assignees];
    for (const assigneeId of assigneeIds) {
      const isMember = project.members.some((m) => String(m.user || m) === String(assigneeId));
      if (!isMember) return res.status(400).json({ message: `Assignee ${assigneeId} must be a project member` });
    }
  }
  
  // Generate sequential issue key
  const lastIssue = await Issue.findOne({ project: projectId }).sort({ key: -1 });
  let nextNumber = 1001; // Start from 1001
  if (lastIssue && lastIssue.key) {
    const lastNumber = parseInt(lastIssue.key.split('-')[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  const key = `${project.key}-${nextNumber}`;
  
  // Prepare issue data, only include fields that have values
  const issueData = {
    key, title, description, type, status, priority, project: projectId, reporter: req.user.id, tags
  };
  
  // Add storyPoints if provided
  if (storyPoints !== undefined) issueData.storyPoints = storyPoints;
  if (dailyStatus !== undefined) issueData.dailyStatus = dailyStatus;
  
  // Add assignees if provided
  if (assignees && assignees.length > 0) {
    issueData.assignees = Array.isArray(assignees) ? assignees : [assignees];
  }
  
  // Add custom fields only if they have values
  if (sprint && sprint.trim()) issueData.sprint = sprint;
  if (acceptanceCriteria && acceptanceCriteria.trim()) issueData.acceptanceCriteria = acceptanceCriteria;
  if (testPlan && testPlan.trim()) issueData.testPlan = testPlan;
  if (startDate) issueData.startDate = startDate;
  if (endDate) issueData.endDate = endDate;
  if (estimate) issueData.estimate = estimate;
  if (actual && (actual.date || actual.hours)) issueData.actual = actual;
  
  const issue = await Issue.create(issueData);
  await logActivity({ action: 'issue_created', actor: req.user.id, project: project._id, issue: issue._id, details: { key: issue.key } });
  if (assignees && assignees.length > 0) {
    // Send notifications to all assignees
    for (const assigneeId of assignees) {
      await sendNotification({ user: assigneeId, type: 'issue_assigned', message: `You were assigned ${issue.key}`, data: { issue: issue._id } });
    }
  }
  res.status(201).json({ issue });
});

const listIssues = asyncHandler(async (req, res) => {
  const filter = buildIssueFilter(req.query, req.user.id);
  
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Sorting parameters
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  
  // Get total count for pagination
  const total = await Issue.countDocuments(filter);
  
  // Get paginated issues
  const issues = await Issue.find(filter)
    .populate('assignees', 'name email')
    .populate('reporter', 'name email')
    .populate('project', 'key name')
    .populate('sprint', 'name')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  res.json({ 
    issues,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  });
});

const getIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate('assignees', 'name email')
    .populate('reporter', 'name email')
    .populate('project', 'key name')
    .populate('sprint', 'name');
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json({ issue });
});

const updateIssue = asyncHandler(async (req, res) => {
  // Extract all fields including custom fields
  const { 
    title, description, type, status, priority, sprint, assignees, tags, storyPoints, dailyStatus,
    // Custom fields
    acceptanceCriteria, testPlan, startDate, endDate, estimate, actual
  } = req.body;
  
  // Build updates object with all provided fields
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (sprint !== undefined) updates.sprint = sprint;
  if (assignees !== undefined) updates.assignees = assignees;
  if (tags !== undefined) updates.tags = tags;
  if (storyPoints !== undefined) updates.storyPoints = storyPoints;
  if (dailyStatus !== undefined) updates.dailyStatus = dailyStatus;
  
  // Add custom fields
  if (acceptanceCriteria !== undefined) updates.acceptanceCriteria = acceptanceCriteria;
  if (testPlan !== undefined) updates.testPlan = testPlan;
  if (startDate !== undefined) updates.startDate = startDate;
  if (endDate !== undefined) updates.endDate = endDate;
  if (estimate !== undefined) updates.estimate = estimate;
  if (actual !== undefined) updates.actual = actual;
  
  // Validate assignees if provided
  if (updates.assignees !== undefined) {
    const existing = await Issue.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Issue not found' });
    const project = await Project.findById(existing.project);
    if (!project) return res.status(400).json({ message: 'Invalid project' });
    
    if (updates.assignees && updates.assignees.length > 0) {
      const assigneeIds = Array.isArray(updates.assignees) ? updates.assignees : [updates.assignees];
      for (const assigneeId of assigneeIds) {
        const isMember = project.members.some((m) => String(m.user || m) === String(assigneeId));
        if (!isMember) return res.status(400).json({ message: `Assignee ${assigneeId} must be a project member` });
      }
      updates.assignees = assigneeIds;
    }
  }
  
  // Filter out empty strings for ObjectId fields to prevent casting errors
  if (updates.sprint === '') {
    delete updates.sprint;
  }
  
  const issue = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await logActivity({ action: 'issue_updated', actor: req.user.id, project: issue.project, issue: issue._id, details: updates });
  res.json({ issue });
});

const deleteIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.findByIdAndDelete(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await logActivity({ action: 'issue_deleted', actor: req.user.id, project: issue.project, issue: issue._id, details: { key: issue.key } });
  res.json({ message: 'Deleted' });
});

const moveIssueStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await logActivity({ action: 'issue_moved', actor: req.user.id, project: issue.project, issue: issue._id, details: { status } });
  res.json({ issue });
});

// Link issues (parent-child or general linking)
const linkIssues = asyncHandler(async (req, res) => {
  const { issueId, targetIssueId, linkType, parentChild } = req.body;
  
  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  
  const targetIssue = await Issue.findById(targetIssueId);
  if (!targetIssue) return res.status(404).json({ message: 'Target issue not found' });
  
  if (parentChild === 'parent') {
    // Set parent-child relationship
    issue.parentIssue = targetIssueId;
    await issue.save();
    await targetIssue.addChildIssue(issueId);
  } else if (parentChild === 'child') {
    // Set child-parent relationship
    targetIssue.parentIssue = issueId;
    await targetIssue.save();
    await issue.addChildIssue(targetIssueId);
  } else {
    // General linking
    await issue.linkIssue(targetIssueId, linkType);
  }
  
  await logActivity({ 
    action: 'issue_linked', 
    actor: req.user.id, 
    project: issue.project, 
    issue: issueId, 
    details: { targetIssueId, linkType, parentChild } 
  });
  
  res.json({ message: 'Issues linked successfully' });
});

// Unlink issues
const unlinkIssues = asyncHandler(async (req, res) => {
  const { issueId, targetIssueId } = req.body;
  
  const issue = await Issue.findById(issueId);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  
  // Remove from childIssues if it's a parent-child relationship
  if (issue.childIssues.includes(targetIssueId)) {
    await issue.removeChildIssue(targetIssueId);
  }
  
  // Remove from linkedIssues
  await issue.unlinkIssue(targetIssueId);
  
  // Also remove parent relationship if exists
  const targetIssue = await Issue.findById(targetIssueId);
  if (targetIssue && targetIssue.parentIssue && targetIssue.parentIssue.equals(issueId)) {
    targetIssue.parentIssue = undefined;
    await targetIssue.save();
  }
  
  await logActivity({ 
    action: 'issue_unlinked', 
    actor: req.user.id, 
    project: issue.project, 
    issue: issueId, 
    details: { targetIssueId } 
  });
  
  res.json({ message: 'Issues unlinked successfully' });
});

// Get issue hierarchy (parent and children)
const getIssueHierarchy = asyncHandler(async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    // Populate parent issue if it exists
    let parentIssue = null;
    if (issue.parentIssue) {
      try {
        parentIssue = await Issue.findById(issue.parentIssue).select('key title type status');
      } catch (err) {
        console.warn('Failed to populate parent issue:', err.message);
      }
    }
    
    // Populate child issues if they exist (include key fields for UI)
    let childIssues = [];
    if (issue.childIssues && issue.childIssues.length > 0) {
      try {
        childIssues = await Issue.find({ _id: { $in: issue.childIssues } })
          .select('key title type status priority estimate assignees description')
          .populate('assignees', 'name email');
      } catch (err) {
        console.warn('Failed to populate child issues:', err.message);
      }
    }
    
    // Populate linked issues if they exist
    let linkedIssues = [];
    if (issue.linkedIssues && issue.linkedIssues.length > 0) {
      try {
        const linkedIssueIds = issue.linkedIssues.map(link => link.issue);
        const linkedIssuesData = await Issue.find({ _id: { $in: linkedIssueIds } }).select('key title type status');
        
        // Reconstruct the linked issues with their link types
        linkedIssues = issue.linkedIssues.map(link => {
          const issueData = linkedIssuesData.find(issue => issue._id.toString() === link.issue.toString());
          return {
            issue: issueData || { _id: link.issue, key: 'Unknown', title: 'Issue not found' },
            linkType: link.linkType
          };
        });
      } catch (err) {
        console.warn('Failed to populate linked issues:', err.message);
      }
    }
    
    res.json({ 
      issue,
      hierarchy: {
        parent: parentIssue,
        children: childIssues,
        linked: linkedIssues
      }
    });
  } catch (err) {
    console.error('Error in getIssueHierarchy:', err);
    res.status(500).json({ message: 'Failed to retrieve issue hierarchy', error: err.message });
  }
});

// Create subtask
const createSubtask = asyncHandler(async (req, res) => {
  const { title, description, parentIssueId, assignees, estimate } = req.body;
  
  const parentIssue = await Issue.findById(parentIssueId);
  if (!parentIssue) return res.status(404).json({ message: 'Parent issue not found' });
  
  // Generate subtask key
  const lastSubtask = await Issue.findOne({ 
    project: parentIssue.project, 
    parentIssue: parentIssueId 
  }).sort({ key: -1 });
  
  let nextNumber = 1;
  if (lastSubtask && lastSubtask.key) {
    const lastNumber = parseInt(lastSubtask.key.split('-')[1]);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }
  
  const key = `${parentIssue.key}-${nextNumber}`;
  
  const subtask = await Issue.create({
    key,
    title,
    description,
    type: 'subtask',
    parentIssue: parentIssueId,
    project: parentIssue.project,
    reporter: req.user.id,
    assignees: assignees || [],
    estimate,
    status: 'backlog'
  });
  
  await logActivity({ 
    action: 'subtask_created', 
    actor: req.user.id, 
    project: parentIssue.project, 
    issue: subtask._id, 
    details: { parentIssueId, title } 
  });
  
  res.status(201).json({ subtask });
});

module.exports = { 
  createIssue, 
  listIssues, 
  getIssue, 
  updateIssue, 
  deleteIssue, 
  moveIssueStatus,
  linkIssues,
  unlinkIssues,
  getIssueHierarchy,
  createSubtask
};


