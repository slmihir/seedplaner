'use strict';

const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema(
  {
    // Global field types that can be used across all projects
    fieldTypes: [{
      value: { type: String, required: true, unique: true },
      label: { type: String, required: true },
      description: { type: String },
      inputType: { type: String, enum: ['text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'radio'], default: 'text' },
      validation: {
        required: { type: Boolean, default: false },
        minLength: { type: Number },
        maxLength: { type: Number },
        min: { type: Number },
        max: { type: Number },
        pattern: { type: String }, // regex pattern
        options: [{ type: String }] // for select/multiselect/radio
      },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }],

    // Global cost categories
    costCategories: [{
      value: { type: String, required: true, unique: true },
      label: { type: String, required: true },
      description: { type: String },
      color: { type: String, default: '#1976d2' },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }],

    // Global user roles and permissions
    roles: [{
      name: { type: String, required: true, unique: true },
      displayName: { type: String, required: true },
      description: { type: String },
      permissions: [{ type: String }],
      isSystemRole: { type: Boolean, default: false }, // Can't be deleted if true
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }],

    // Global validation rules
    validationRules: {
      password: {
        minLength: { type: Number, default: 6 },
        requireUppercase: { type: Boolean, default: false },
        requireLowercase: { type: Boolean, default: false },
        requireNumbers: { type: Boolean, default: false },
        requireSpecialChars: { type: Boolean, default: false }
      },
      project: {
        keyPattern: { type: String, default: '^[A-Z]+$' },
        keyMinLength: { type: Number, default: 2 },
        keyMaxLength: { type: Number, default: 10 }
      }
    },

    // Global UI settings
    uiSettings: {
      defaultTheme: { type: String, enum: ['light', 'dark'], default: 'light' },
      defaultLanguage: { type: String, default: 'en' },
      itemsPerPage: { type: Number, default: 20 },
      maxItemsPerPage: { type: Number, default: 100 },
      enableNotifications: { type: Boolean, default: true },
      enableEmailNotifications: { type: Boolean, default: false }
    },

    // Global workflow templates
    workflowTemplates: [{
      name: { type: String, required: true },
      description: { type: String },
      issueTypes: [{ type: String }], // Which issue types this template applies to
      statuses: [{
        value: { type: String, required: true },
        label: { type: String, required: true },
        color: { type: String, default: '#ECEFF1' },
        order: { type: Number, required: true },
        isActive: { type: Boolean, default: true }
      }],
      transitions: [{
        from: { type: String, required: true },
        to: { type: String, required: true },
        label: { type: String },
        isActive: { type: Boolean, default: true }
      }],
      isDefault: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }],

    // System metadata
    version: { type: String, default: '1.0.0' },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { 
    timestamps: true,
    collection: 'systemconfig'
  }
);

// Ensure only one system config document exists
SystemConfigSchema.index({}, { unique: true });

// Static method to get or create system config
SystemConfigSchema.statics.getSystemConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.createDefaultConfig();
  }
  return config;
};

// Static method to create default system config
SystemConfigSchema.statics.createDefaultConfig = async function() {
  const defaultConfig = {
    fieldTypes: [
      { value: 'text', label: 'Text', description: 'Single line text input', inputType: 'text' },
      { value: 'textarea', label: 'Text Area', description: 'Multi-line text input', inputType: 'textarea' },
      { value: 'number', label: 'Number', description: 'Numeric input', inputType: 'number' },
      { value: 'date', label: 'Date', description: 'Date picker', inputType: 'date' },
      { value: 'datetime', label: 'Date & Time', description: 'Date and time picker', inputType: 'datetime' },
      { value: 'select', label: 'Select', description: 'Single choice dropdown', inputType: 'select' },
      { value: 'multiselect', label: 'Multi Select', description: 'Multiple choice dropdown', inputType: 'multiselect' },
      { value: 'checkbox', label: 'Checkbox', description: 'Boolean checkbox', inputType: 'checkbox' },
      { value: 'radio', label: 'Radio', description: 'Single choice radio buttons', inputType: 'radio' }
    ],
    costCategories: [
      { value: 'aws', label: 'AWS Services', description: 'Amazon Web Services costs', color: '#FF9900' },
      { value: 'lucid', label: 'Lucidchart', description: 'Lucidchart subscription and usage', color: '#1976d2' },
      { value: 'tools', label: 'Development Tools', description: 'Software development tools', color: '#4caf50' },
      { value: 'infrastructure', label: 'Infrastructure', description: 'Server and hosting costs', color: '#ff9800' },
      { value: 'software', label: 'Software Licenses', description: 'Software licensing costs', color: '#9c27b0' },
      { value: 'consulting', label: 'Consulting', description: 'External consulting services', color: '#f44336' },
      { value: 'training', label: 'Training', description: 'Training and education costs', color: '#00bcd4' },
      { value: 'other', label: 'Other', description: 'Other miscellaneous costs', color: '#607d8b' }
    ],
    roles: [
      { 
        name: 'admin', 
        displayName: 'Administrator', 
        description: 'Full system access',
        permissions: [
          'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles',
          'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.manage_members', 'projects.manage_settings',
          'issues.create', 'issues.read', 'issues.update', 'issues.delete', 'issues.assign', 'issues.change_status',
          'sprints.create', 'sprints.read', 'sprints.update', 'sprints.delete', 'sprints.start', 'sprints.complete',
          'boards.read', 'boards.move_cards', 'boards.manage_columns',
          'reports.view', 'reports.export', 'analytics.view',
          'system.settings', 'system.backup', 'system.logs'
        ],
        isSystemRole: true
      },
      { 
        name: 'manager', 
        displayName: 'Manager', 
        description: 'Project and team management',
        permissions: [
          'users.read', 'users.update',
          'projects.create', 'projects.read', 'projects.update', 'projects.manage_members', 'projects.manage_settings',
          'issues.create', 'issues.read', 'issues.update', 'issues.delete', 'issues.assign', 'issues.change_status',
          'sprints.create', 'sprints.read', 'sprints.update', 'sprints.delete', 'sprints.start', 'sprints.complete',
          'boards.read', 'boards.move_cards',
          'reports.view', 'reports.export', 'analytics.view'
        ],
        isSystemRole: true
      },
      { 
        name: 'developer', 
        displayName: 'Developer', 
        description: 'Development team member',
        permissions: [
          'projects.read',
          'issues.create', 'issues.read', 'issues.update', 'issues.assign', 'issues.change_status',
          'sprints.read',
          'boards.read', 'boards.move_cards'
        ],
        isSystemRole: true
      },
      { 
        name: 'viewer', 
        displayName: 'Viewer', 
        description: 'Read-only access',
        permissions: [
          'projects.read',
          'issues.read',
          'sprints.read',
          'boards.read'
        ],
        isSystemRole: true
      }
    ],
    workflowTemplates: [
      {
        name: 'Standard Workflow',
        description: 'Standard workflow for bugs, stories, and tasks',
        issueTypes: ['bug', 'story', 'task'],
        statuses: [
          { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
          { value: 'analysis_ready', label: 'Analysis Ready', color: '#E3F2FD', order: 2 },
          { value: 'analysis', label: 'Analysis', color: '#E8F5E9', order: 3 },
          { value: 'development', label: 'Development', color: '#FFF3E0', order: 4 },
          { value: 'acceptance', label: 'Acceptance', color: '#F3E5F5', order: 5 },
          { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
        ],
        transitions: [
          { from: 'backlog', to: 'analysis_ready' },
          { from: 'analysis_ready', to: 'analysis' },
          { from: 'analysis', to: 'development' },
          { from: 'development', to: 'acceptance' },
          { from: 'acceptance', to: 'released' }
        ],
        isDefault: true
      },
      {
        name: 'Subtask Workflow',
        description: 'Simplified workflow for subtasks',
        issueTypes: ['subtask'],
        statuses: [
          { value: 'backlog', label: 'Backlog', color: '#ECEFF1', order: 1 },
          { value: 'development', label: 'Development', color: '#FFF3E0', order: 2 },
          { value: 'code_review', label: 'Code Review', color: '#E8F5E9', order: 3 },
          { value: 'qa', label: 'QA', color: '#E3F2FD', order: 4 },
          { value: 'deployment', label: 'Deployment', color: '#F3E5F5', order: 5 },
          { value: 'released', label: 'Released', color: '#E0F7FA', order: 6 }
        ],
        transitions: [
          { from: 'backlog', to: 'development' },
          { from: 'development', to: 'code_review' },
          { from: 'code_review', to: 'qa' },
          { from: 'qa', to: 'deployment' },
          { from: 'deployment', to: 'released' }
        ],
        isDefault: true
      }
    ]
  };

  return await this.create(defaultConfig);
};

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);

