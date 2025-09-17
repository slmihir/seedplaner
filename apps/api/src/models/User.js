'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Role', 
      required: true 
    },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

module.exports = mongoose.model('User', UserSchema);


