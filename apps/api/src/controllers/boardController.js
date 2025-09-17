'use strict';

const Issue = require('../models/Issue');
const Project = require('../models/Project');
const ProjectConfig = require('../models/ProjectConfig');
const SystemConfig = require('../models/SystemConfig');
const { asyncHandler } = require('../utils/asyncHandler');

const getBoard = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });

  // Get project configuration to determine available statuses
  let projectConfig = await ProjectConfig.findOne({ project: projectId });
  
  // If no project config exists, use default workflow template
  if (!projectConfig) {
    const systemConfig = await SystemConfig.getSystemConfig();
    const defaultTemplate = systemConfig.workflowTemplates.find(t => t.isDefault && t.issueTypes.includes('task'));
    
    if (defaultTemplate) {
      // Create a temporary config object with default statuses
      projectConfig = {
        statuses: defaultTemplate.statuses.map(s => ({
          value: s.value,
          label: s.label,
          color: s.color,
          order: s.order
        }))
      };
    } else {
      // Fallback to hardcoded statuses if no template found
      projectConfig = {
        statuses: [
          { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
          { value: 'analysis_ready', label: 'Analysis Ready', color: '#E3F2FD', order: 2 },
          { value: 'analysis', label: 'Analysis', color: '#E8F5E9', order: 3 },
          { value: 'development', label: 'Development', color: '#FFF3E0', order: 4 },
          { value: 'acceptance', label: 'Acceptance', color: '#F3E5F5', order: 5 },
          { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
        ]
      };
    }
  }

  // Get all unique statuses from project configuration
  const statuses = projectConfig.statuses
    .filter(s => s.isActive !== false)
    .sort((a, b) => a.order - b.order)
    .map(s => s.value);

  const columns = {};
  await Promise.all(
    statuses.map(async (status) => {
      const cards = await Issue.find({ project: projectId, status }).select('key title type priority assignee');
      columns[status] = cards;
    })
  );

  res.json({ 
    project: { 
      id: project._id, 
      key: project.key, 
      name: project.name, 
      boardType: project.boardType 
    }, 
    columns,
    statuses: projectConfig.statuses,
    config: {
      hasProjectConfig: !!projectConfig._id,
      isUsingDefault: !projectConfig._id
    }
  });
});

const moveCard = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { status, sprint } = req.body;
  const issue = await Issue.findByIdAndUpdate(issueId, { status, sprint }, { new: true });
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  res.json({ issue });
});

module.exports = { getBoard, moveCard };


