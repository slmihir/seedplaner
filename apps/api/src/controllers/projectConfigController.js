const ProjectConfig = require('../models/ProjectConfig');
const Project = require('../models/Project');
const { asyncHandler } = require('../middleware/error');
const { hasPermission } = require('../middleware/permissions');

// Get project configuration
const getProjectConfig = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Check if user has access to project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.read')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  
  let config = await ProjectConfig.findOne({ project: projectId });
  
  // If no config exists, create default one
  if (!config) {
    config = await createDefaultConfig(projectId, req.user.id);
  }
  
  res.json({ config });
});

// Update project configuration
const updateProjectConfig = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const updates = req.body;
  
  // Check if user has access to project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check permissions - only admins and managers can modify config
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  
  let config = await ProjectConfig.findOne({ project: projectId });
  
  if (!config) {
    // Create new config
    config = new ProjectConfig({
      project: projectId,
      ...updates,
      lastModifiedBy: req.user.id
    });
  } else {
    // Update existing config
    Object.assign(config, updates);
    config.lastModifiedBy = req.user.id;
  }
  
  await config.save();
  
  res.json({ 
    message: 'Project configuration updated successfully',
    config 
  });
});

// Create default configuration for a project
const createDefaultConfig = async (projectId, userId) => {
  const defaultConfig = new ProjectConfig({
    project: projectId,
    lastModifiedBy: userId,
    issueTypes: [
      {
        name: 'task',
        displayName: 'Task',
        description: 'A general task or work item',
        icon: 'assignment',
        color: 'default',
        workflow: ['backlog', 'analysis_ready', 'analysis', 'development', 'acceptance', 'released'],
        
        isDefault: true,
        isActive: true
      },
      {
        name: 'bug',
        displayName: 'Bug',
        description: 'A defect or issue that needs to be fixed',
        icon: 'bug_report',
        color: 'error',
        workflow: ['backlog', 'analysis_ready', 'analysis', 'development', 'acceptance', 'released'],
        isActive: true
      },
      {
        name: 'story',
        displayName: 'Story',
        description: 'A user story or feature request',
        icon: 'book',
        color: 'primary',
        workflow: ['backlog', 'analysis_ready', 'analysis', 'development', 'acceptance', 'released'],
        isActive: true
      },
      {
        name: 'subtask',
        displayName: 'Subtask',
        description: 'A subtask or child issue',
        icon: 'list',
        color: 'secondary',
        workflow: ['backlog', 'development', 'code_review', 'qa', 'deployment', 'released'],
        isActive: true
      }
    ],
    customFields: [
      {
        name: 'acceptanceCriteria',
        displayName: 'Acceptance Criteria',
        type: 'textarea',
        description: 'Criteria that must be met for the issue to be considered complete',
        applicableTo: ['story'],
        isActive: true,
        order: 1
      },
      {
        name: 'testPlan',
        displayName: 'Test Plan',
        type: 'textarea',
        description: 'Plan for testing this issue',
        applicableTo: ['bug', 'story'],
        isActive: true,
        order: 2
      },
      {
        name: 'startDate',
        displayName: 'Start Date',
        type: 'date',
        description: 'When work on this issue should begin',
        applicableTo: ['task', 'bug', 'story'],
        isActive: true,
        order: 3
      },
      {
        name: 'endDate',
        displayName: 'End Date',
        type: 'date',
        description: 'When work on this issue should be completed',
        applicableTo: ['task', 'bug', 'story'],
        isActive: true,
        order: 4
      },
      {
        name: 'estimate',
        displayName: 'Estimate (Hours)',
        type: 'number',
        description: 'Estimated hours to complete this issue',
        validation: { min: 0 },
        applicableTo: ['task', 'bug', 'story'],
        isActive: true,
        order: 5
      },
      {
        name: 'actualHours',
        displayName: 'Actual Hours',
        type: 'number',
        description: 'Actual hours spent on this issue',
        validation: { min: 0 },
        applicableTo: ['task', 'bug', 'story'],
        isActive: true,
        order: 6
      }
    ],
    statuses: [
      { name: 'backlog', displayName: 'Backlog', color: 'default', isDefault: true, isActive: true, order: 1 },
      { name: 'analysis_ready', displayName: 'Analysis Ready', color: 'info', isActive: true, order: 2 },
      { name: 'analysis', displayName: 'Analysis', color: 'info', isActive: true, order: 3 },
      { name: 'development', displayName: 'Development', color: 'primary', isActive: true, order: 4 },
      { name: 'code_review', displayName: 'Code Review', color: 'warning', isActive: true, order: 5 },
      { name: 'qa', displayName: 'QA', color: 'warning', isActive: true, order: 6 },
      { name: 'deployment', displayName: 'Deployment', color: 'secondary', isActive: true, order: 7 },
      { name: 'acceptance', displayName: 'Acceptance', color: 'secondary', isActive: true, order: 8 },
      { name: 'released', displayName: 'Released', color: 'success', isActive: true, order: 9 }
    ],
    priorities: [
      { name: 'low', displayName: 'Low', color: 'success', level: 1, isActive: true },
      { name: 'medium', displayName: 'Medium', color: 'warning', level: 2, isDefault: true, isActive: true },
      { name: 'high', displayName: 'High', color: 'error', level: 3, isActive: true },
      { name: 'critical', displayName: 'Critical', color: 'error', level: 4, isActive: true }
    ]
  });
  
  return await defaultConfig.save();
};

// Initialize default configuration for a project
const initializeDefaultConfig = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Check if user has access to project
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check permissions
  if (!hasPermission(req.user.role, 'projects.manage_settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  
  // Check if config already exists
  const existingConfig = await ProjectConfig.findOne({ project: projectId });
  if (existingConfig) {
    return res.status(400).json({ message: 'Project configuration already exists' });
  }
  
  const config = await createDefaultConfig(projectId, req.user.id);
  
  res.json({ 
    message: 'Default project configuration created successfully',
    config 
  });
});

// Get available field types
const getFieldTypes = asyncHandler(async (req, res) => {
  const SystemConfig = require('../models/SystemConfig');
  const systemConfig = await SystemConfig.getSystemConfig();
  const activeFieldTypes = systemConfig.fieldTypes.filter(ft => ft.isActive);
  res.json({ fieldTypes: activeFieldTypes });
});

// Get available issue types for a project
const getIssueTypes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Check if user has access to project
  const Project = require('../models/Project');
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check if user has access to this project
  const hasAccess = project.owner.toString() === req.user.id || 
                   project.members.some(member => member.user.toString() === req.user.id);
  if (!hasAccess) {
    return res.status(403).json({ message: 'Access denied to this project' });
  }
  
  // Get project configuration
  let projectConfig = await ProjectConfig.findOne({ project: projectId });
  
  // If no project config exists, return default issue types
  if (!projectConfig) {
    const defaultIssueTypes = [
      { name: 'task', displayName: 'Task', description: 'A general task or work item', icon: 'assignment', color: 'default', isDefault: true, isActive: true },
      { name: 'bug', displayName: 'Bug', description: 'A defect or issue that needs to be fixed', icon: 'bug_report', color: 'error', isActive: true },
      { name: 'story', displayName: 'Story', description: 'A user story or feature request', icon: 'book', color: 'primary', isActive: true },
      { name: 'subtask', displayName: 'Subtask', description: 'A subtask or child issue', icon: 'list', color: 'secondary', isActive: true }
    ];
    return res.json({ issueTypes: defaultIssueTypes });
  }
  
  const activeIssueTypes = projectConfig.issueTypes.filter(it => it.isActive);
  res.json({ issueTypes: activeIssueTypes });
});

// Get available priorities for a project
const getPriorities = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  
  // Check if user has access to project
  const Project = require('../models/Project');
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check if user has access to this project
  const hasAccess = project.owner.toString() === req.user.id || 
                   project.members.some(member => member.user.toString() === req.user.id);
  if (!hasAccess) {
    return res.status(403).json({ message: 'Access denied to this project' });
  }
  
  // Get project configuration
  let projectConfig = await ProjectConfig.findOne({ project: projectId });
  
  // If no project config exists, return default priorities
  if (!projectConfig) {
    const defaultPriorities = [
      { name: 'low', displayName: 'Low', color: 'success', level: 1, isActive: true },
      { name: 'medium', displayName: 'Medium', color: 'warning', level: 2, isDefault: true, isActive: true },
      { name: 'high', displayName: 'High', color: 'error', level: 3, isActive: true },
      { name: 'critical', displayName: 'Critical', color: 'error', level: 4, isActive: true }
    ];
    return res.json({ priorities: defaultPriorities });
  }
  
  const activePriorities = projectConfig.priorities.filter(p => p.isActive);
  res.json({ priorities: activePriorities });
});

// Sync workflow changes from project config to system config
const syncWorkflowToSystemConfig = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { workflowName, statuses } = req.body;
  
  if (!workflowName || !statuses) {
    return res.status(400).json({ message: 'Workflow name and statuses are required' });
  }

  // Check if user has access to project
  const Project = require('../models/Project');
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check permissions - only admins and managers can sync to system config
  if (!hasPermission(req.user.role, 'system-config.update')) {
    return res.status(403).json({ message: 'Insufficient permissions to update system configuration' });
  }

  // Get project configuration
  const projectConfig = await ProjectConfig.findOne({ project: projectId });
  if (!projectConfig) {
    return res.status(404).json({ message: 'Project configuration not found' });
  }

  // Update system configuration with the workflow template
  const SystemConfig = require('../models/SystemConfig');
  const systemConfig = await SystemConfig.getSystemConfig();
  
  if (!systemConfig.workflowTemplates) {
    systemConfig.workflowTemplates = [];
  }

  // Find existing template or create new one
  const templateIndex = systemConfig.workflowTemplates.findIndex(t => t.name === workflowName);
  
  const templateData = {
    name: workflowName,
    description: `${workflowName} workflow from project ${project.name}`,
    statuses: statuses,
    isActive: true,
    lastUpdated: new Date(),
    updatedBy: req.user.id,
    sourceProject: projectId
  };

  if (templateIndex >= 0) {
    // Update existing template
    systemConfig.workflowTemplates[templateIndex] = {
      ...systemConfig.workflowTemplates[templateIndex],
      ...templateData
    };
  } else {
    // Add new template
    systemConfig.workflowTemplates.push({
      ...templateData,
      createdAt: new Date(),
      createdBy: req.user.id
    });
  }

  systemConfig.lastUpdated = new Date();
  systemConfig.updatedBy = req.user.id;

  await systemConfig.save();

  res.json({ 
    message: 'Workflow template synced to system configuration successfully',
    template: systemConfig.workflowTemplates[templateIndex >= 0 ? templateIndex : systemConfig.workflowTemplates.length - 1]
  });
});

module.exports = {
  getProjectConfig,
  updateProjectConfig,
  initializeDefaultConfig,
  getFieldTypes,
  getIssueTypes,
  getPriorities,
  syncWorkflowToSystemConfig
};
