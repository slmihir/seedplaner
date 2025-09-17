const express = require('express');
const router = express.Router();
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  initializeDefaultRoles,
  getRoleStats
} = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');
const { asyncHandler } = require('../middleware/error');

// All routes require authentication
router.use(authenticate);

// Get all roles
router.get('/', 
  requirePermission('roles.read'),
  asyncHandler(getRoles)
);

// Get role statistics
router.get('/stats',
  requirePermission('roles.read'),
  asyncHandler(getRoleStats)
);

// Get all available permissions
router.get('/permissions',
  requirePermission('roles.read'),
  asyncHandler(getPermissions)
);

// Initialize default roles
router.post('/initialize',
  requirePermission('roles.create'),
  asyncHandler(initializeDefaultRoles)
);

// Get single role
router.get('/:id',
  requirePermission('roles.read'),
  asyncHandler(getRole)
);

// Create new role
router.post('/',
  requirePermission('roles.create'),
  asyncHandler(createRole)
);

// Update role
router.put('/:id',
  requirePermission('roles.update'),
  asyncHandler(updateRole)
);

// Delete role
router.delete('/:id',
  requirePermission('roles.delete'),
  asyncHandler(deleteRole)
);

module.exports = router;