'use strict';

const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const registerValidators = [
  body('name').isString().trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 6 })
];

const loginValidators = [
  body('email').isEmail(),
  body('password').isString().notEmpty()
];

const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });
  const token = generateToken(user);
  res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
});

const login = asyncHandler(async (req, res) => {
  console.log('AuthController: Login attempt for email:', req.body.email);
  console.log('AuthController: Request body:', req.body);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('AuthController: Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  console.log('AuthController: Looking up user with email:', email);
  
  const user = await User.findOne({ email });
  if (!user) {
    console.log('AuthController: User not found for email:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  console.log('AuthController: User found, comparing password for user:', user.name);
  const ok = await user.comparePassword(password);
  if (!ok) {
    console.log('AuthController: Password comparison failed for user:', user.name);
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  console.log('AuthController: Login successful for user:', user.name);
  
  // Populate role for login response
  let populatedRole = null;
  if (user.role) {
    try {
      const Role = require('../models/Role');
      const mongoose = require('mongoose');
      
      // Convert string to ObjectId if needed
      const roleId = typeof user.role === 'string' ? new mongoose.Types.ObjectId(user.role) : user.role;
      populatedRole = await Role.findById(roleId);
      
      if (!populatedRole) {
        console.error(`Role not found for user ${user.email}, role ID: ${user.role}`);
        populatedRole = await Role.findOne({ name: 'admin' });
      }
    } catch (error) {
      console.error('Error populating role during login:', error);
    }
  }
  
  const token = generateToken(user);
  res.json({ 
    user: { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: populatedRole || user.role 
    }, 
    token 
  });
});

module.exports = { register, login, registerValidators, loginValidators };


