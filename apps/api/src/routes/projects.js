'use strict';

const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createProject, listProjects, getProject, updateProject, deleteProject, listProjectMembers, addProjectMember, updateProjectMember, removeProjectMember } = require('../controllers/projectController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.post('/', authenticate, authorize('admin', 'manager'), asyncHandler(createProject));
router.get('/', authenticate, asyncHandler(listProjects));
router.get('/:id', authenticate, asyncHandler(getProject));
router.patch('/:id', authenticate, authorize('admin', 'manager'), asyncHandler(updateProject));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(deleteProject));

// Members management (project-level)
router.get('/:id/members', authenticate, asyncHandler(listProjectMembers));
router.post('/:id/members', authenticate, authorize('admin', 'manager'), asyncHandler(addProjectMember));
router.patch('/:id/members/:memberId', authenticate, authorize('admin', 'manager'), asyncHandler(updateProjectMember));
router.delete('/:id/members/:memberId', authenticate, authorize('admin', 'manager'), asyncHandler(removeProjectMember));

module.exports = router;


