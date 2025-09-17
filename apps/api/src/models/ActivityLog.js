'use strict';

const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    details: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);


