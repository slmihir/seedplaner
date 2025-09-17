'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { createSprint, listSprints, getSprint, updateSprint, deleteSprint, startSprint, completeSprint, getSprintSummary } = require('../controllers/sprintController');
const Issue = require('../models/Issue');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.post('/', authenticate, asyncHandler(createSprint));
router.get('/', authenticate, asyncHandler(listSprints));
router.get('/:id', authenticate, asyncHandler(getSprint));
router.get('/:id/summary', authenticate, asyncHandler(getSprintSummary));
router.patch('/:id', authenticate, asyncHandler(updateSprint));
router.post('/:id/start', authenticate, asyncHandler(startSprint));
router.post('/:id/complete', authenticate, asyncHandler(completeSprint));
router.delete('/:id', authenticate, asyncHandler(deleteSprint));

// Add/remove issue to/from a sprint
router.post('/:id/issues/:issueId', authenticate, asyncHandler(async (req, res) => {
  const { id, issueId } = req.params;
  const issue = await Issue.findByIdAndUpdate(issueId, { sprint: id }, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json({ issue });
}));

router.delete('/:id/issues/:issueId', authenticate, asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const issue = await Issue.findByIdAndUpdate(issueId, { sprint: null }, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json({ issue });
}));

module.exports = router;


