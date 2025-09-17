'use strict';

const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberStats
} = require('../controllers/globalMembersController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all members with pagination, search, and filtering
router.get('/', authorize('admin', 'manager'), asyncHandler(getAllMembers));

// Get member statistics
router.get('/stats', authorize('admin', 'manager'), asyncHandler(getMemberStats));

// Get a specific member
router.get('/:id', authorize('admin', 'manager'), asyncHandler(getMember));

// Create a new member
router.post('/', authorize('admin'), asyncHandler(createMember));

// Update a member
router.patch('/:id', authorize('admin', 'manager'), asyncHandler(updateMember));

// Delete a member
router.delete('/:id', authorize('admin'), asyncHandler(deleteMember));

module.exports = router;
