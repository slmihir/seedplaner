'use strict';

const mongoose = require('mongoose');

const SprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    goal: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false },
    completedAt: { type: Date },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sprint', SprintSchema);


