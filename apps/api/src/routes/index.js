'use strict';

const { Router } = require('express');

const authRoutes = require('./auth');
const userRoutes = require('./users');
const projectRoutes = require('./projects');
const issueRoutes = require('./issues');
const sprintRoutes = require('./sprints');
const boardRoutes = require('./boards');
const globalMembersRoutes = require('./globalMembers');
const roleRoutes = require('./roles');
const projectConfigRoutes = require('./projectConfig');
const sprintReportRoutes = require('./sprintReports');
const costRoutes = require('./costs');
const budgetRoutes = require('./budgets');
const githubRoutes = require('./github');
const systemConfigRoutes = require('./systemConfig');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/issues', issueRoutes);
router.use('/sprints', sprintRoutes);
router.use('/boards', boardRoutes);
router.use('/global-members', globalMembersRoutes);
router.use('/roles', roleRoutes);
router.use('/project-config', projectConfigRoutes);
router.use('/sprint-reports', sprintReportRoutes);
router.use('/costs', costRoutes);
router.use('/budgets', budgetRoutes);
router.use('/github', githubRoutes);
router.use('/system-config', systemConfigRoutes);

module.exports = router;


