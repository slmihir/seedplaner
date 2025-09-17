'use strict';

const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getMe, listUsers, updateUserRole, getUserProfile, updateUserProfile, getUserPermissions } = require('../controllers/userController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.get('/me', authenticate, asyncHandler(getMe));
router.get('/permissions', authenticate, asyncHandler(getUserPermissions));
router.get('/', authenticate, authorize('admin', 'manager'), asyncHandler(listUsers));
router.get('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(getUserProfile));
router.patch('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(updateUserProfile));
router.patch('/:id/role', authenticate, authorize('admin'), asyncHandler(updateUserRole));

module.exports = router;


