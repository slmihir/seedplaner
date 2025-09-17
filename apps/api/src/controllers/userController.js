'use strict';

const User = require('../models/User');
const { asyncHandler } = require('../utils/asyncHandler');
const { getUserPermissions: getRolePermissions, hasPermission } = require('../middleware/permissions');

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role avatarUrl isActive');
  
  // Manually populate the role since mongoose populate wasn't working
  let populatedRole = null;
  if (user.role) {
    try {
      const Role = require('../models/Role');
      const mongoose = require('mongoose');
      
      // Convert string to ObjectId if needed
      const roleId = typeof user.role === 'string' ? new mongoose.Types.ObjectId(user.role) : user.role;
      populatedRole = await Role.findById(roleId);
      
      // Log error if role not found
      if (!populatedRole) {
        console.error(`Role not found for user ${user.email}, role ID: ${user.role}`);
        // Try to find admin role as fallback
        populatedRole = await Role.findOne({ name: 'admin' });
        if (!populatedRole) {
          console.error('Admin role not found either!');
        }
      }
    } catch (error) {
      console.error('Error populating role:', error);
    }
  }
  
  const permissions = await getRolePermissions(populatedRole);
  
  res.json({ 
    user: {
      ...user.toObject(),
      role: populatedRole,
      permissions
    }
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('name email role avatarUrl isActive').populate({
    path: 'role',
    select: 'name displayName permissions isActive'
  });
  res.json({ users });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  // Validate role
  const validRoles = ['admin', 'developer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('name email role isActive');
  res.json({ user });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('name email role avatarUrl isActive createdAt');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  const permissions = getRolePermissions(user.role);
  res.json({ 
    user: {
      ...user.toObject(),
      permissions
    }
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, isActive } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (isActive !== undefined) updateData.isActive = isActive;
  
  const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('name email role avatarUrl isActive');
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ user });
});

const getUserPermissions = asyncHandler(async (req, res) => {
  const permissions = getRolePermissions(req.user.role);
  const roleInfo = {
    role: req.user.role,
    permissions,
    permissionsCount: permissions.length
  };
  
  res.json(roleInfo);
});

module.exports = { 
  getMe, 
  listUsers, 
  updateUserRole, 
  getUserProfile, 
  updateUserProfile, 
  getUserPermissions 
};


