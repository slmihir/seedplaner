'use strict';

const User = require('../models/User');
const Project = require('../models/Project');
const { asyncHandler } = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityLogService');

// Get all users with pagination, search, and filtering
const getAllMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', role = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
  
  // Build filter object
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) {
    filter.role = role;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get users with pagination
  const users = await User.find(filter)
    .select('-passwordHash') // Exclude password hash
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const total = await User.countDocuments(filter);

  // Get project membership info for each user
  const usersWithProjects = await Promise.all(
    users.map(async (user) => {
      const projects = await Project.find({ 'members.user': user._id })
        .select('key name members')
        .populate('members.user', 'name email');
      
      const projectMemberships = projects.map(project => {
        const membership = project.members.find(m => m.user._id.toString() === user._id.toString());
        return {
          projectId: project._id,
          projectKey: project.key,
          projectName: project.name,
          role: membership.role
        };
      });

      return {
        ...user.toObject(),
        projectMemberships
      };
    })
  );

  res.json({
    members: usersWithProjects,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get a specific member by ID
const getMember = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ message: 'Member not found' });
  }

  // Get project memberships
  const projects = await Project.find({ 'members.user': user._id })
    .select('key name members')
    .populate('members.user', 'name email');
  
  const projectMemberships = projects.map(project => {
    const membership = project.members.find(m => m.user._id.toString() === user._id.toString());
    return {
      projectId: project._id,
      projectKey: project.key,
      projectName: project.name,
      role: membership.role
    };
  });

  res.json({
    member: {
      ...user.toObject(),
      projectMemberships
    }
  });
});

// Create a new member (user)
const createMember = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'developer' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    passwordHash: await User.hashPassword(password),
    role
  });

  await logActivity({
    action: 'member_created',
    actor: req.user.id,
    details: { userId: user._id, email: user.email, role: user.role }
  });

  res.status(201).json({
    member: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

// Update a member
const updateMember = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (password) updates.passwordHash = await User.hashPassword(password);

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-passwordHash');

  if (!user) {
    return res.status(404).json({ message: 'Member not found' });
  }

  await logActivity({
    action: 'member_updated',
    actor: req.user.id,
    details: { userId: user._id, updates }
  });

  res.json({ member: user });
});

// Delete a member
const deleteMember = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user is assigned to any projects
  const projectsWithUser = await Project.find({ 'members.user': userId });
  if (projectsWithUser.length > 0) {
    return res.status(400).json({
      message: 'Cannot delete member who is assigned to projects. Remove from all projects first.'
    });
  }

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    return res.status(404).json({ message: 'Member not found' });
  }

  await logActivity({
    action: 'member_deleted',
    actor: req.user.id,
    details: { userId, email: user.email }
  });

  res.json({ message: 'Member deleted successfully' });
});

// Get member statistics
const getMemberStats = asyncHandler(async (req, res) => {
  const totalMembers = await User.countDocuments();
  const membersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]);

  const activeMembers = await User.countDocuments({
    updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });

  res.json({
    totalMembers,
    activeMembers,
    membersByRole: membersByRole.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  });
});

module.exports = {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats
};
