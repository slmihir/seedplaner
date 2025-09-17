const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: String,
    required: true
  }],
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false // Optional for system-wide roles
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ organization: 1 });
roleSchema.index({ isActive: 1 });

// Pre-save middleware to update lastModifiedBy
roleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastModifiedBy = this.createdBy; // In real implementation, this would be the current user
  }
  next();
});

// Static method to get default system roles
roleSchema.statics.getDefaultRoles = function() {
  return [
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Master account with full system access',
      permissions: [
        'users.create', 'users.read', 'users.update', 'users.delete',
        'projects.create', 'projects.read', 'projects.update', 'projects.delete',
        'issues.create', 'issues.read', 'issues.update', 'issues.delete',
        'sprints.create', 'sprints.read', 'sprints.update', 'sprints.delete',
        'sprints.generate_reports', 'sprints.view_reports',
        'boards.read', 'boards.update',
        'roles.create', 'roles.read', 'roles.update', 'roles.delete',
        'system_config.read', 'system_config.update',
        'project_config.create', 'project_config.read', 'project_config.update', 'project_config.delete',
        'costs.create', 'costs.read', 'costs.update', 'costs.delete',
        'budgets.create', 'budgets.read', 'budgets.update', 'budgets.delete',
        'github.integration', 'github.webhooks'
      ],
      isSystem: true,
      isActive: true
    },
    {
      name: 'developer',
      displayName: 'Developer',
      description: 'Restricted access for development work',
      permissions: [
        'projects.read',
        'issues.create', 'issues.read', 'issues.update',
        'sprints.read',
        'boards.read', 'boards.update',
        'costs.read',
        'budgets.read'
      ],
      isSystem: true,
      isActive: true
    }
  ];
};

// Static method to initialize default roles
roleSchema.statics.initializeDefaultRoles = async function(createdBy) {
  const defaultRoles = this.getDefaultRoles();
  const existingRoles = await this.find({ isSystem: true });
  
  if (existingRoles.length === 0) {
    const rolesToCreate = defaultRoles.map(role => ({
      ...role,
      createdBy,
      lastModifiedBy: createdBy
    }));
    
    const savedRoles = await this.insertMany(rolesToCreate);
    console.log('Default roles initialized successfully');
    return savedRoles;
  }
  
  return existingRoles;
};

// Instance method to check if user has permission
roleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Instance method to add permission
roleSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this;
};

// Instance method to remove permission
roleSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this;
};

module.exports = mongoose.model('Role', roleSchema);