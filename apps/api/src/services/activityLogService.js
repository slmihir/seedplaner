'use strict';

const ActivityLog = require('../models/ActivityLog');

async function logActivity({ action, actor, project, issue, details }) {
  return ActivityLog.create({ action, actor, project, issue, details });
}

module.exports = { logActivity };


