const Role = require('../models/Role');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

// Get all roles
const getRoles = asyncHandler(async (req, res) => {
  const { organization, isActive } = req.query;
  
  const filter = {};
  if (organization) filter.organization = organization;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  
  const roles = await Role.find(filter)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email')
    .sort({ name: 1 });
  
  res.json({
    success: true,
    roles,
    count: roles.length
  });
});

// Get single role
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');
  
  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }
  
  res.json({
    success: true,
    role
  });
});

// Create new role
const createRole = asyncHandler(async (req, res) => {
  const { name, displayName, description, permissions, organization } = req.body;
  
  // Check if role name already exists
  const existingRole = await Role.findOne({ name });
  if (existingRole) {
    return res.status(400).json({
      success: false,
      message: 'Role name already exists'
    });
  }
  
  const role = await Role.create({
    name,
    displayName,
    description,
    permissions: permissions || [],
    organization,
    createdBy: req.user._id,
    lastModifiedBy: req.user._id
  });
  
  await role.populate('createdBy', 'name email');
  await role.populate('lastModifiedBy', 'name email');
  
  res.status(201).json({
    success: true,
    message: 'Role created successfully',
    role
  });
});

// Update role
const updateRole = asyncHandler(async (req, res) => {
  const { name, displayName, description, permissions, isActive } = req.body;
  
  const role = await Role.findById(req.params.id);
  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }
  
  // Prevent modification of system roles
  if (role.isSystem) {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify system roles'
    });
  }
  
  // Check if new name conflicts with existing role
  if (name && name !== role.name) {
    const existingRole = await Role.findOne({ name, _id: { $ne: req.params.id } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }
  }
  
  const updatedRole = await Role.findByIdAndUpdate(
    req.params.id,
    {
      ...(name && { name }),
      ...(displayName && { displayName }),
      ...(description !== undefined && { description }),
      ...(permissions && { permissions }),
      ...(isActive !== undefined && { isActive }),
      lastModifiedBy: req.user._id
    },
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email')
   .populate('lastModifiedBy', 'name email');
  
  res.json({
    success: true,
    message: 'Role updated successfully',
    role: updatedRole
  });
});

// Delete role
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    return res.status(404).json({
      success: false,
      message: 'Role not found'
    });
  }
  
  // Prevent deletion of system roles
  if (role.isSystem) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete system roles'
    });
  }
  
  // Check if role is assigned to any users
  const usersWithRole = await User.find({ role: req.params.id });
  if (usersWithRole.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s)`
    });
  }
  
  await Role.findByIdAndDelete(req.params.id);
  
  res.json({
    success: true,
    message: 'Role deleted successfully'
  });
});

// Get all available permissions
const getPermissions = asyncHandler(async (req, res) => {
  const permissions = [
    // User management
    { name: 'users.create', description: 'Create new users' },
    { name: 'users.read', description: 'View user information' },
    { name: 'users.update', description: 'Update user information' },
    { name: 'users.delete', description: 'Delete users' },
    
    // Project management
    { name: 'projects.create', description: 'Create new projects' },
    { name: 'projects.read', description: 'View projects' },
    { name: 'projects.update', description: 'Update project information' },
    { name: 'projects.delete', description: 'Delete projects' },
    
    // Issue management
    { name: 'issues.create', description: 'Create new issues' },
    { name: 'issues.read', description: 'View issues' },
    { name: 'issues.update', description: 'Update issues' },
    { name: 'issues.delete', description: 'Delete issues' },
    
    // Sprint management
    { name: 'sprints.create', description: 'Create new sprints' },
    { name: 'sprints.read', description: 'View sprints' },
    { name: 'sprints.update', description: 'Update sprints' },
    { name: 'sprints.delete', description: 'Delete sprints' },
    { name: 'sprints.generate_reports', description: 'Generate sprint reports' },
    { name: 'sprints.view_reports', description: 'View sprint reports' },
    
    // Board management
    { name: 'boards.read', description: 'View Kanban boards' },
    { name: 'boards.update', description: 'Update board statuses' },
    
    // Role management
    { name: 'roles.create', description: 'Create new roles' },
    { name: 'roles.read', description: 'View roles' },
    { name: 'roles.update', description: 'Update roles' },
    { name: 'roles.delete', description: 'Delete roles' },
    
    // System configuration
    { name: 'system_config.read', description: 'View system configuration' },
    { name: 'system_config.update', description: 'Update system configuration' },
    
    // Project configuration
    { name: 'project_config.create', description: 'Create project configuration' },
    { name: 'project_config.read', description: 'View project configuration' },
    { name: 'project_config.update', description: 'Update project configuration' },
    { name: 'project_config.delete', description: 'Delete project configuration' },
    
    // Cost management
    { name: 'costs.create', description: 'Create cost entries' },
    { name: 'costs.read', description: 'View cost information' },
    { name: 'costs.update', description: 'Update cost entries' },
    { name: 'costs.delete', description: 'Delete cost entries' },
    
    // Budget management
    { name: 'budgets.create', description: 'Create budgets' },
    { name: 'budgets.read', description: 'View budget information' },
    { name: 'budgets.update', description: 'Update budgets' },
    { name: 'budgets.delete', description: 'Delete budgets' },
    
    // GitHub integration
    { name: 'github.integration', description: 'Manage GitHub integration' },
    { name: 'github.webhooks', description: 'Manage GitHub webhooks' }
  ];
  
  res.json({
    success: true,
    permissions
  });
});

// Initialize default roles
const initializeDefaultRoles = asyncHandler(async (req, res) => {
  const roles = await Role.initializeDefaultRoles(req.user._id);
  
  res.json({
    success: true,
    message: 'Default roles initialized successfully',
    roles
  });
});

// Get role statistics
const getRoleStats = asyncHandler(async (req, res) => {
  const totalRoles = await Role.countDocuments();
  const activeRoles = await Role.countDocuments({ isActive: true });
  const systemRoles = await Role.countDocuments({ isSystem: true });
  const customRoles = await Role.countDocuments({ isSystem: false });
  
  // Get user count per role
  const roleUserCounts = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'role' } },
    { $unwind: '$role' },
    { $project: { roleName: '$role.name', roleDisplayName: '$role.displayName', userCount: '$count' } },
    { $sort: { userCount: -1 } }
  ]);
  
  res.json({
    success: true,
    stats: {
      totalRoles,
      activeRoles,
      systemRoles,
      customRoles,
      roleUserCounts
    }
  });
});

module.exports = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  initializeDefaultRoles,
  getRoleStats
};