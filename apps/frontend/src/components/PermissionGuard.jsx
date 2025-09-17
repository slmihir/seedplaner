import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, Box } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

const PermissionGuard = ({ 
  children, 
  permission, 
  permissions = [], 
  role, 
  roles = [], 
  fallback = null,
  showError = true 
}) => {
  const { user } = useAuth();

  if (!user) {
    return showError ? (
      <Alert severity="error" icon={<SecurityIcon />}>
        Authentication required
      </Alert>
    ) : null;
  }

  // Check role-based access
  if (role || roles.length > 0) {
    const requiredRoles = role ? [role, ...roles] : roles;
    const hasRequiredRole = requiredRoles.some(r => {
      // Handle both string roles and role objects
      const userRoleName = typeof user.role === 'string' ? user.role : user.role?.name;
      const roleHierarchy = ['developer', 'admin'];
      const userLevel = roleHierarchy.indexOf(userRoleName);
      const requiredLevel = roleHierarchy.indexOf(r);
      return userLevel >= requiredLevel;
    });

    if (!hasRequiredRole) {
      return showError ? (
        <Alert severity="warning" icon={<SecurityIcon />}>
          Insufficient role level. Required: {requiredRoles.join(' or ')}. Current: {typeof user.role === 'string' ? user.role : user.role?.name}
        </Alert>
      ) : fallback;
    }
  }

  // Check permission-based access
  if (permission || permissions.length > 0) {
    const requiredPermissions = permission ? [permission, ...permissions] : permissions;
    const userPermissions = user.permissions || [];
    
    const hasRequiredPermission = requiredPermissions.some(p => 
      userPermissions.includes(p)
    );

    if (!hasRequiredPermission) {
      return showError ? (
        <Alert severity="warning" icon={<SecurityIcon />}>
          Insufficient permissions. Required: {requiredPermissions.join(' or ')}
        </Alert>
      ) : fallback;
    }
  }

  return children;
};

// Higher-order component for permission-based rendering
export const withPermission = (WrappedComponent, permissionConfig) => {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard {...permissionConfig}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user || !user.permissions) return false;
    return permissions.some(p => user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions) => {
    if (!user || !user.permissions) return false;
    return permissions.every(p => user.permissions.includes(p));
  };

  const hasRole = (role) => {
    if (!user) return false;
    const userRoleName = typeof user.role === 'string' ? user.role : user.role?.name;
    return userRoleName === role;
  };

  const hasRoleOrHigher = (requiredRole) => {
    if (!user) return false;
    const userRoleName = typeof user.role === 'string' ? user.role : user.role?.name;
    const roleHierarchy = ['developer', 'admin'];
    const userLevel = roleHierarchy.indexOf(userRoleName);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  };

  const canPerformAction = (action, resource) => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission);
  };

  return {
    user,
    permissions: user?.permissions || [],
    role: user?.role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasRoleOrHigher,
    canPerformAction
  };
};

export default PermissionGuard;
