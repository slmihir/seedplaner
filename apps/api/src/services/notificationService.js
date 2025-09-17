'use strict';

const Notification = require('../models/Notification');

async function sendNotification({ user, type, message, data }) {
  return Notification.create({ user, type, message, data });
}

async function markAsRead(notificationId) {
  return Notification.findByIdAndUpdate(notificationId, { readAt: new Date() }, { new: true });
}

module.exports = { sendNotification, markAsRead };


