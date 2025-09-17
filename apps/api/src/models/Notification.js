'use strict';

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['issue_assigned', 'comment', 'status_change', 'mention'], required: true },
    message: { type: String, required: true },
    data: { type: Object },
    readAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);


