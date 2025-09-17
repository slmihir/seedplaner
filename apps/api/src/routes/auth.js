'use strict';

const { Router } = require('express');
const { register, login, registerValidators, loginValidators } = require('../controllers/authController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

router.post('/register', registerValidators, asyncHandler(register));
router.post('/login', loginValidators, asyncHandler(login));

module.exports = router;


