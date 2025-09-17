'use strict';

const Project = require('../models/Project');
const { asyncHandler } = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');
const User = require('../models/User');

const createProject = asyncHandler(async (req, res) => {
  const { key, name, description, boardType, members, status } = req.body;
  const normalizedMembers = Array.isArray(members)
    ? members.map((m) => (typeof m === 'string' ? { user: m, role: 'assignee' } : m))
    : [{ user: req.user.id, role: 'admin' }];
  if (!normalizedMembers.find((m) => String(m.user) === String(req.user.id))) {
    normalizedMembers.push({ user: req.user.id, role: 'admin' });
  }
  const project = await Project.create({ key, name, description, boardType, owner: req.user.id, members: normalizedMembers, status: status || 'active' });
  await logActivity({ action: 'project_created', actor: req.user.id, project: project._id, details: { key: project.key, name: project.name } });
  
  // Populate the created project before sending response
  const populatedProject = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email role avatarUrl');
  
  // Filter out members with null user references
  const cleanedProject = {
    ...populatedProject.toObject(),
    members: (populatedProject.members || []).filter(member => member && member.user !== null && member.user !== undefined)
  };
  
  res.status(201).json({ project: cleanedProject });
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ $or: [{ owner: req.user.id }, { 'members.user': req.user.id }] })
    .populate('owner', 'name email')
    .populate('members.user', 'name email role avatarUrl');
  
  // Filter out members with null user references
  const cleanedProjects = projects.map(project => ({
    ...project.toObject(),
    members: (project.members || []).filter(member => member && member.user !== null && member.user !== undefined)
  }));
  
  res.json({ projects: cleanedProjects });
});

const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('members.user', 'name email role avatarUrl');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Filter out members with null user references
  const cleanedProject = {
    ...project.toObject(),
    members: (project.members || []).filter(member => member && member.user !== null && member.user !== undefined)
  };
  
  res.json({ project: cleanedProject });
});

const updateProject = asyncHandler(async (req, res) => {
  const updates = (({ name, description, boardType, members, status }) => ({ name, description, boardType, members, status }))(req.body);
  if (Array.isArray(updates.members)) {
    updates.members = updates.members.map((m) => (typeof m === 'string' ? { user: m, role: 'assignee' } : m));
  }
  const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('owner', 'name email')
    .populate('members.user', 'name email role avatarUrl');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Filter out members with null user references
  const cleanedProject = {
    ...project.toObject(),
    members: (project.members || []).filter(member => member && member.user !== null && member.user !== undefined)
  };
  
  await logActivity({ action: 'project_updated', actor: req.user.id, project: project._id, details: updates });
  res.json({ project: cleanedProject });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  await logActivity({ action: 'project_deleted', actor: req.user.id, project: project._id, details: { key: project.key } });
  res.json({ message: 'Deleted' });
});

function getUserProjectRole(project, userId) {
  if (!project || !project.members || !Array.isArray(project.members)) {
    return null;
  }
  
  const m = project.members.find((mm) => {
    if (!mm || !mm.user) {
      return false;
    }
    return String(mm.user) === String(userId);
  });
  
  return m?.role || (String(project.owner) === String(userId) ? 'admin' : null);
}

// Members management
const listProjectMembers = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('members.user', 'name email role avatarUrl');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Check if user is system admin (has admin role)
  const userRole = req.user.role;
  const isSystemAdmin = (typeof userRole === 'string' && userRole === 'admin') || 
                       (userRole && userRole.name === 'admin');
  
  // Allow system admins to access all projects, otherwise check project membership
  const role = isSystemAdmin ? 'admin' : getUserProjectRole(project, req.user.id);
  if (!role) return res.status(403).json({ message: 'Forbidden' });
  
  res.json({ members: project.members });
});

const addProjectMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  
  // Validate required fields
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  // Validate that the user exists
  const User = require('../models/User');
  try {
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(400).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    throw error;
  }
  
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Check if user is system admin (has admin role)
  const userRole = req.user.role;
  const isSystemAdmin = (typeof userRole === 'string' && userRole === 'admin') || 
                       (userRole && userRole.name === 'admin');
  
  // Allow system admins to add members, otherwise check project admin role
  const currentRole = isSystemAdmin ? 'admin' : getUserProjectRole(project, req.user.id);
  if (currentRole !== 'admin') return res.status(403).json({ message: 'Forbidden: Only project admins can add members' });
  
  if (!['admin', 'editor', 'assignee'].includes(role || 'assignee')) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  if (project.members.find((m) => m && m.user && String(m.user) === String(userId))) {
    return res.status(400).json({ message: 'User already a member' });
  }
  
  try {
    project.members.push({ user: userId, role: role || 'assignee' });
    await project.save();
    await project.populate('members.user', 'name email role avatarUrl');
    await logActivity({ action: 'member_added', actor: req.user.id, project: project._id, details: { user: userId, role: role || 'assignee' } });
    res.status(201).json({ members: project.members });
  } catch (error) {
    console.error('Error adding project member:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation error: ' + error.message });
    }
    res.status(500).json({ message: 'Failed to add member to project' });
  }
});

const updateProjectMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params; // user id
  const { role } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Check if user is system admin (has admin role)
  const userRole = req.user.role;
  const isSystemAdmin = (typeof userRole === 'string' && userRole === 'admin') || 
                       (userRole && userRole.name === 'admin');
  
  // Allow system admins to update members, otherwise check project admin role
  const currentRole = isSystemAdmin ? 'admin' : getUserProjectRole(project, req.user.id);
  if (currentRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const member = project.members.find((m) => m && m.user && String(m.user) === String(memberId));
  if (!member) return res.status(404).json({ message: 'Member not found' });
  if (!['admin', 'editor', 'assignee'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  member.role = role;
  await project.save();
  await project.populate('members.user', 'name email role avatarUrl');
  await logActivity({ action: 'member_updated', actor: req.user.id, project: project._id, details: { user: memberId, role } });
  res.json({ members: project.members });
});

const removeProjectMember = asyncHandler(async (req, res) => {
  const { memberId } = req.params; // user id
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  
  // Check if user is system admin (has admin role)
  const userRole = req.user.role;
  const isSystemAdmin = (typeof userRole === 'string' && userRole === 'admin') || 
                       (userRole && userRole.name === 'admin');
  
  // Allow system admins to remove members, otherwise check project admin role
  const currentRole = isSystemAdmin ? 'admin' : getUserProjectRole(project, req.user.id);
  if (currentRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const before = project.members.length;
  project.members = project.members.filter((m) => m && m.user && String(m.user) !== String(memberId));
  if (project.members.length === before) return res.status(404).json({ message: 'Member not found' });
  await project.save();
  await logActivity({ action: 'member_removed', actor: req.user.id, project: project._id, details: { user: memberId } });
  res.json({ members: project.members });
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject, listProjectMembers, addProjectMember, updateProjectMember, removeProjectMember };


