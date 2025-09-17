'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { requireAnyPermission } = require('../middleware/permissions');
const { createIssue, listIssues, getIssue, updateIssue, deleteIssue, moveIssueStatus, linkIssues, unlinkIssues, getIssueHierarchy, createSubtask } = require('../controllers/issueController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.post('/', authenticate, asyncHandler(createIssue));
router.get('/', authenticate, asyncHandler(listIssues));
router.get('/:id', authenticate, asyncHandler(getIssue));
router.patch('/:id', authenticate, requireAnyPermission('issues.update'), asyncHandler(updateIssue));
router.delete('/:id', authenticate, asyncHandler(deleteIssue));

// Board-like move
router.post('/:id/move', authenticate, asyncHandler(moveIssueStatus));

// Issue linking and hierarchy
router.post('/link', authenticate, asyncHandler(linkIssues));
router.post('/unlink', authenticate, asyncHandler(unlinkIssues));
router.get('/:id/hierarchy', authenticate, asyncHandler(getIssueHierarchy));
router.post('/subtask', authenticate, asyncHandler(createSubtask));

module.exports = router;


