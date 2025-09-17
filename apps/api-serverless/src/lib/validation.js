/**
 * Validation schemas using Joi
 */

const Joi = require('joi');

/**
 * User validation schemas
 */
exports.validateUser = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'manager', 'developer').default('developer')
  });

  return schema.validate(data);
};

exports.validateUserUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('admin', 'manager', 'developer'),
    isActive: Joi.boolean()
  });

  return schema.validate(data);
};

/**
 * Project validation schemas
 */
exports.validateProject = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).allow(''),
    key: Joi.string().min(2).max(10).uppercase().required(),
    members: Joi.array().items(Joi.string()),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    status: Joi.string().valid('active', 'inactive', 'completed').default('active')
  });

  return schema.validate(data);
};

exports.validateProjectUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(1000).allow(''),
    members: Joi.array().items(Joi.string()),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    status: Joi.string().valid('active', 'inactive', 'completed')
  });

  return schema.validate(data);
};

/**
 * Issue validation schemas
 */
exports.validateIssue = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(5000).allow(''),
    type: Joi.string().valid('story', 'task', 'bug', 'subtask').required(),
    status: Joi.string().required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
    project: Joi.string().required(),
    sprint: Joi.string().allow(''),
    assignees: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    storyPoints: Joi.number().min(0).max(100),
    dailyStatus: Joi.string().valid('green', 'yellow', 'white'),
    // Custom fields
    acceptanceCriteria: Joi.string().max(2000).allow(''),
    testPlan: Joi.string().max(2000).allow(''),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    estimate: Joi.number().min(0),
    actual: Joi.number().min(0)
  });

  return schema.validate(data);
};

exports.validateIssueUpdate = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(2).max(200),
    description: Joi.string().max(5000).allow(''),
    type: Joi.string().valid('story', 'task', 'bug', 'subtask'),
    status: Joi.string(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
    sprint: Joi.string().allow(''),
    assignees: Joi.array().items(Joi.string()),
    tags: Joi.array().items(Joi.string()),
    storyPoints: Joi.number().min(0).max(100),
    dailyStatus: Joi.string().valid('green', 'yellow', 'white'),
    // Custom fields
    acceptanceCriteria: Joi.string().max(2000).allow(''),
    testPlan: Joi.string().max(2000).allow(''),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    estimate: Joi.number().min(0),
    actual: Joi.number().min(0)
  });

  return schema.validate(data);
};

/**
 * Sprint validation schemas
 */
exports.validateSprint = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).allow(''),
    project: Joi.string().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    goal: Joi.string().max(500).allow(''),
    status: Joi.string().valid('planning', 'active', 'completed').default('planning')
  });

  return schema.validate(data);
};

exports.validateSprintUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string().max(1000).allow(''),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    goal: Joi.string().max(500).allow(''),
    status: Joi.string().valid('planning', 'active', 'completed')
  });

  return schema.validate(data);
};

/**
 * Cost validation schemas
 */
exports.validateCost = (data) => {
  const schema = Joi.object({
    project: Joi.string().required(),
    category: Joi.string().valid('development', 'infrastructure', 'tools', 'other').required(),
    description: Joi.string().min(2).max(200).required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
    date: Joi.date().iso().required(),
    tags: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

/**
 * System config validation schemas
 */
exports.validateSystemConfig = (data) => {
  const schema = Joi.object({
    workflowTemplates: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        issueTypes: Joi.array().items(Joi.string()).required(),
        statuses: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
            isCompleted: Joi.boolean().default(false)
          })
        ).required()
      })
    ),
    defaultIssueTypes: Joi.array().items(Joi.string()),
    defaultStatuses: Joi.array().items(Joi.string()),
    features: Joi.object({
      costTracking: Joi.boolean().default(false),
      githubIntegration: Joi.boolean().default(false),
      sprintReports: Joi.boolean().default(false)
    })
  });

  return schema.validate(data);
};

/**
 * Project config validation schemas
 */
exports.validateProjectConfig = (data) => {
  const schema = Joi.object({
    issueTypes: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
        workflow: Joi.string().required()
      })
    ),
    statuses: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
        isCompleted: Joi.boolean().default(false)
      })
    ),
    priorities: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).required(),
        level: Joi.number().min(1).max(4).required()
      })
    ),
    customFields: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        type: Joi.string().valid('text', 'number', 'date', 'select', 'multiselect').required(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()).when('type', {
          is: Joi.string().valid('select', 'multiselect'),
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      })
    )
  });

  return schema.validate(data);
};

/**
 * Login validation schema
 */
exports.validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

/**
 * Generic validation helper
 */
exports.validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return { error: true, errors };
  }
  
  return { error: false, value };
};
