/**
 * Authentication utilities for Lambda functions
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Authenticate user from Authorization header
 */
exports.authenticate = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return null;
  }
};

/**
 * Generate JWT token for user
 */
exports.generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Hash password using bcrypt
 */
exports.hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
exports.comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Middleware function to check authentication
 */
exports.requireAuth = (handler) => {
  return async (event, context) => {
    try {
      const user = await exports.authenticate(event.headers.Authorization);
      
      if (!user) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: true,
            message: 'Unauthorized - Invalid or missing token'
          })
        };
      }

      // Add user to event for use in handler
      event.user = user;
      return handler(event, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: true,
          message: 'Internal server error'
        })
      };
    }
  };
};

/**
 * Check if user has required role
 */
exports.requireRole = (allowedRoles) => {
  return (handler) => {
    return async (event, context) => {
      const user = event.user;
      
      if (!user || !allowedRoles.includes(user.role)) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: true,
            message: 'Forbidden - Insufficient permissions'
          })
        };
      }

      return handler(event, context);
    };
  };
};

/**
 * Check if user has permission for specific action
 */
exports.requirePermission = (permission) => {
  return (handler) => {
    return async (event, context) => {
      const user = event.user;
      
      // Define role-based permissions
      const rolePermissions = {
        admin: ['*'], // Admin has all permissions
        manager: ['projects.read', 'projects.update', 'issues.read', 'issues.update', 'sprints.read', 'sprints.update', 'users.read'],
        developer: ['issues.read', 'issues.update', 'sprints.read']
      };

      const userPermissions = rolePermissions[user.role] || [];
      
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
            error: true,
            message: 'Forbidden - Insufficient permissions'
          })
        };
      }

      return handler(event, context);
    };
  };
};
