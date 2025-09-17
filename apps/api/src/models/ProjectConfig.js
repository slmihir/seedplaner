'use strict';

const mongoose = require('mongoose');

const ProjectConfigSchema = new mongoose.Schema(
  {
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Project', 
      required: true,
      unique: true 
    },
    
    // Customizable Issue Types
    issueTypes: [{
      name: { type: String, required: true, trim: true },
      displayName: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      icon: { type: String, default: 'assignment' },
      color: { type: String, default: 'default' },
      workflow: [{ type: String }], // Array of status names
      isDefault: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true }
    }],
    
    // Customizable Custom Fields
    customFields: [{
      name: { type: String, required: true, trim: true },
      displayName: { type: String, required: true, trim: true },
      type: { 
        type: String, 
        enum: ['text', 'textarea', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'url', 'email'],
        required: true 
      },
      description: { type: String, trim: true },
      required: { type: Boolean, default: false },
      defaultValue: { type: mongoose.Schema.Types.Mixed },
      options: [{ type: String }], // For select/multiselect fields
      validation: {
        min: { type: Number },
        max: { type: Number },
        minLength: { type: Number },
        maxLength: { type: Number },
        pattern: { type: String } // Regex pattern
      },
      applicableTo: [{ type: String }], // Which issue types this field applies to
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
    
    // Customizable Statuses
    statuses: [{
      name: { type: String, required: true, trim: true },
      displayName: { type: String, required: true, trim: true },
      description: { type: String, trim: true },
      color: { type: String, default: 'default' },
      isDefault: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 }
    }],
    
    // Customizable Priorities
    priorities: [{
      name: { type: String, required: true, trim: true },
      displayName: { type: String, required: true, trim: true },
      color: { type: String, default: 'default' },
      level: { type: Number, default: 0 }, // Higher number = higher priority
      isDefault: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true }
    }],
    
    // Configuration metadata
    version: { type: String, default: '1.0' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Indexes
ProjectConfigSchema.index({ project: 1 });
ProjectConfigSchema.index({ 'issueTypes.name': 1 });
ProjectConfigSchema.index({ 'customFields.name': 1 });

// Pre-save middleware to ensure at least one default issue type
ProjectConfigSchema.pre('save', function(next) {
  if (this.issueTypes.length > 0) {
    const hasDefault = this.issueTypes.some(type => type.isDefault);
    if (!hasDefault) {
      this.issueTypes[0].isDefault = true;
    }
  }
  next();
});

module.exports = mongoose.model('ProjectConfig', ProjectConfigSchema);
