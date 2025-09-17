'use strict';

const mongoose = require('mongoose');

const ProjectMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'editor', 'assignee'], default: 'assignee' }
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [ProjectMemberSchema], default: [] },
    boardType: { type: String, enum: ['scrum', 'kanban'], default: 'kanban' },
    status: { 
      type: String, 
      enum: ['active', 'on_hold', 'completed', 'cancelled'], 
      default: 'active' 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', ProjectSchema);


