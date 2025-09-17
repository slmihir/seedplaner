'use strict';

const SystemConfig = require('../models/SystemConfig');
const { asyncHandler } = require('../utils/asyncHandler');
const { hasPermission } = require('../middleware/permissions');

// Get system configuration
const getSystemConfig = asyncHandler(async (req, res) => {
  const config = await SystemConfig.getSystemConfig();
  res.json({ config });
});

// Update system configuration
const updateSystemConfig = asyncHandler(async (req, res) => {
  // Check permissions
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  
  // Update specific sections
  const { fieldTypes, costCategories, roles, validationRules, uiSettings, workflowTemplates } = req.body;
  
  if (fieldTypes !== undefined) {
    config.fieldTypes = fieldTypes;
  }
  if (costCategories !== undefined) {
    config.costCategories = costCategories;
  }
  if (roles !== undefined) {
    config.roles = roles;
  }
  if (validationRules !== undefined) {
    config.validationRules = validationRules;
  }
  if (uiSettings !== undefined) {
    config.uiSettings = uiSettings;
  }
  if (workflowTemplates !== undefined) {
    config.workflowTemplates = workflowTemplates;
  }

  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ config });
});

// Add new field type
const addFieldType = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { value, label, description, inputType, validation } = req.body;

  // Check if field type already exists
  const existingFieldType = config.fieldTypes.find(ft => ft.value === value);
  if (existingFieldType) {
    return res.status(400).json({ message: 'Field type already exists' });
  }

  config.fieldTypes.push({
    value,
    label,
    description,
    inputType: inputType || 'text',
    validation: validation || {},
    createdAt: new Date()
  });

  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ fieldType: config.fieldTypes[config.fieldTypes.length - 1] });
});

// Update field type
const updateFieldType = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { fieldTypeValue } = req.params;
  const { label, description, inputType, validation, isActive } = req.body;

  const fieldType = config.fieldTypes.find(ft => ft.value === fieldTypeValue);
  if (!fieldType) {
    return res.status(404).json({ message: 'Field type not found' });
  }

  if (label !== undefined) fieldType.label = label;
  if (description !== undefined) fieldType.description = description;
  if (inputType !== undefined) fieldType.inputType = inputType;
  if (validation !== undefined) fieldType.validation = validation;
  if (isActive !== undefined) fieldType.isActive = isActive;

  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ fieldType });
});

// Delete field type
const deleteFieldType = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { fieldTypeValue } = req.params;

  const fieldTypeIndex = config.fieldTypes.findIndex(ft => ft.value === fieldTypeValue);
  if (fieldTypeIndex === -1) {
    return res.status(404).json({ message: 'Field type not found' });
  }

  config.fieldTypes.splice(fieldTypeIndex, 1);
  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ message: 'Field type deleted successfully' });
});

// Add new cost category
const addCostCategory = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { value, label, description, color } = req.body;

  // Check if category already exists
  const existingCategory = config.costCategories.find(cc => cc.value === value);
  if (existingCategory) {
    return res.status(400).json({ message: 'Cost category already exists' });
  }

  config.costCategories.push({
    value,
    label,
    description,
    color: color || '#1976d2',
    createdAt: new Date()
  });

  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ category: config.costCategories[config.costCategories.length - 1] });
});

// Update cost category
const updateCostCategory = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { categoryValue } = req.params;
  const { label, description, color, isActive } = req.body;

  const category = config.costCategories.find(cc => cc.value === categoryValue);
  if (!category) {
    return res.status(404).json({ message: 'Cost category not found' });
  }

  if (label !== undefined) category.label = label;
  if (description !== undefined) category.description = description;
  if (color !== undefined) category.color = color;
  if (isActive !== undefined) category.isActive = isActive;

  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ category });
});

// Delete cost category
const deleteCostCategory = asyncHandler(async (req, res) => {
  if (!hasPermission(req.user.role, 'system.settings')) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const config = await SystemConfig.getSystemConfig();
  const { categoryValue } = req.params;

  const categoryIndex = config.costCategories.findIndex(cc => cc.value === categoryValue);
  if (categoryIndex === -1) {
    return res.status(404).json({ message: 'Cost category not found' });
  }

  config.costCategories.splice(categoryIndex, 1);
  config.lastUpdated = new Date();
  config.updatedBy = req.user.id;

  await config.save();
  res.json({ message: 'Cost category deleted successfully' });
});

// Get available field types (for backward compatibility)
const getFieldTypes = asyncHandler(async (req, res) => {
  const config = await SystemConfig.getSystemConfig();
  const activeFieldTypes = config.fieldTypes.filter(ft => ft.isActive);
  res.json({ fieldTypes: activeFieldTypes });
});

// Get available cost categories (for backward compatibility)
const getCostCategories = asyncHandler(async (req, res) => {
  const config = await SystemConfig.getSystemConfig();
  const activeCategories = config.costCategories.filter(cc => cc.isActive);
  res.json({ categories: activeCategories });
});

// Get workflow templates
const getWorkflowTemplates = asyncHandler(async (req, res) => {
  console.log('🔍 getWorkflowTemplates called');
  try {
    const config = await SystemConfig.getSystemConfig();
    const activeTemplates = config.workflowTemplates ? config.workflowTemplates.filter(wt => wt.isActive !== false) : [];
    console.log('✅ Found templates:', activeTemplates.length);
    res.json({ templates: activeTemplates });
  } catch (error) {
    console.error('❌ Error in getWorkflowTemplates:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get roles and permissions
const getRoles = asyncHandler(async (req, res) => {
  const config = await SystemConfig.getSystemConfig();
  const activeRoles = config.roles.filter(r => r.isActive);
  res.json({ roles: activeRoles });
});

// Update workflow template
const updateWorkflowTemplate = asyncHandler(async (req, res) => {
  console.log('🔍 updateWorkflowTemplate called with:', req.body);
  
  try {
    const { template } = req.body;
    
    if (!template) {
      console.log('❌ No template data provided');
      return res.status(400).json({ message: 'Template data is required' });
    }

    console.log('✅ Template data received:', template);

    const config = await SystemConfig.getSystemConfig();
    
    if (!config.workflowTemplates) {
      config.workflowTemplates = [];
    }

    // Find and update the template
    const templateIndex = config.workflowTemplates.findIndex(t => t.name === template.name);
    
    if (templateIndex >= 0) {
      // Update existing template
      config.workflowTemplates[templateIndex] = {
        ...config.workflowTemplates[templateIndex],
        ...template,
        lastUpdated: new Date(),
        updatedBy: req.user.id
      };
    } else {
      // Add new template
      config.workflowTemplates.push({
        ...template,
        createdAt: new Date(),
        createdBy: req.user.id,
        lastUpdated: new Date(),
        updatedBy: req.user.id
      });
    }

    config.lastUpdated = new Date();
    config.updatedBy = req.user.id;

    await config.save();
    
    console.log('✅ Workflow template saved successfully');
    res.json({ 
      message: 'Workflow template updated successfully',
      template: config.workflowTemplates[templateIndex >= 0 ? templateIndex : config.workflowTemplates.length - 1]
    });
  } catch (error) {
    console.error('❌ Error in updateWorkflowTemplate:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = {
  getSystemConfig,
  updateSystemConfig,
  addFieldType,
  updateFieldType,
  deleteFieldType,
  addCostCategory,
  updateCostCategory,
  deleteCostCategory,
  getFieldTypes,
  getCostCategories,
  getWorkflowTemplates,
  updateWorkflowTemplate,
  getRoles
};

