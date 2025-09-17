'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { getBoard, moveCard } = require('../controllers/boardController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.get('/:projectId', authenticate, asyncHandler(getBoard));
router.post('/move/:issueId', authenticate, asyncHandler(moveCard));

module.exports = router;


