'use strict';

const Role = require('../models/Role');

// Permission checking function with dynamic roles
async function hasPermission(userRole, permission) {
  try {
    // If userRole is a string (legacy), find the role by name
    let role;
    if (typeof userRole === 'string') {
      role = await Role.findOne({ name: userRole, isActive: true });
    } else if (userRole && userRole._id) {
      // If userRole is a populated role object, use it directly
      role = userRole;
    } else {
      // If userRole is an ObjectId, populate it
      role = await Role.findById(userRole).populate('permissions');
    }
    
    if (!role) {
      return false;
    }
    
    return role.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

// Middleware factory for permission checking
function requirePermission(permission) {
  return async function permissionMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const hasRequiredPermission = await hasPermission(req.user.role, permission);
    if (!hasRequiredPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permission,
        currentRole: req.user.role
      });
    }
    
    next();
  };
}

// Multiple permissions middleware
function requireAnyPermission(...permissions) {
  return async function permissionMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const permissionChecks = await Promise.all(
      permissions.map(permission => hasPermission(req.user.role, permission))
    );
    
    const hasAnyPermission = permissionChecks.some(check => check);
    
    if (!hasAnyPermission) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: permissions,
        currentRole: req.user.role
      });
    }
    
    next();
  };
}

// Get user permissions from role
async function getUserPermissions(userRole) {
  try {
    let role;
    if (typeof userRole === 'string') {
      role = await Role.findOne({ name: userRole, isActive: true });
    } else {
      role = await Role.findById(userRole);
    }
    
    return role ? role.permissions : [];
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

// Check if user can perform action on resource
async function canPerformAction(userRole, action, resource) {
  const permission = `${resource}.${action}`;
  return await hasPermission(userRole, permission);
}

// Middleware for checking permissions (alias for requirePermission)
const hasPermissionMiddleware = requirePermission;

module.exports = {
  hasPermission,
  requirePermission,
  requireAnyPermission,
  getUserPermissions,
  canPerformAction,
  hasPermissionMiddleware
};
