'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserPermissions, hasPermission } = require('./permissions');

function generateToken(user) {
  const payload = { id: user._id, role: user.role };
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '7d' };
  return jwt.sign(payload, secret, options);
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('role');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user permissions from role
    const permissions = await getUserPermissions(user.role);
    
    req.user = { 
      _id: user._id,
      id: user._id.toString(), 
      role: user.role,
      permissions: permissions,
      name: user.name,
      email: user.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function authorize(...roles) {
  return async function roleMiddleware(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      
      // Check if user has any of the required roles using dynamic permissions
      if (roles.length > 0) {
        const userRole = req.user.role;
        let hasRequiredRole = false;
        
        // Handle both string role names and populated role objects
        if (typeof userRole === 'string') {
          hasRequiredRole = roles.includes(userRole);
        } else if (userRole && userRole.name) {
          hasRequiredRole = roles.includes(userRole.name);
        }
        
        if (!hasRequiredRole) {
          return res.status(403).json({ message: 'Forbidden' });
        }
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Authorization error' });
    }
  };
}

module.exports = { authenticate, authorize, generateToken };


