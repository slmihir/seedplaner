/**
 * Create project Lambda handler
 */

const { v4: uuidv4 } = require('uuid');
const { validateProject } = require('../../lib/validation');
const { createCreatedResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth, requireRole } = require('../../lib/auth');
const { query, putItem } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = validateProject(body);
    if (error) {
      return createErrorResponse(400, 'Validation failed', error.errors);
    }

    const user = event.user;
    const { key, members = [], ...projectData } = value;

    // Check if project key already exists
    const existingProjects = await query(
      'GSI1PK = :key',
      { ':key': `KEY#${key}` },
      { IndexName: 'GSI1' }
    );

    if (existingProjects.length > 0) {
      return createErrorResponse(409, 'Project key already exists');
    }

    // Validate members if provided
    if (members.length > 0) {
      for (const memberId of members) {
        const member = await getItem(`USER#${memberId}`, `USER#${memberId}`);
        if (!member) {
          return createErrorResponse(400, `User ${memberId} not found`);
        }
      }
    }

    // Add creator to members if not already included
    if (!members.includes(user.id)) {
      members.push(user.id);
    }

    // Create project
    const projectId = uuidv4();
    const project = {
      PK: `PROJECT#${projectId}`,
      SK: `PROJECT#${projectId}`,
      GSI1PK: `KEY#${key}`,
      GSI1SK: `PROJECT#${Date.now()}`,
      GSI2PK: `USER#${user.id}`,
      GSI2SK: `PROJECT#${Date.now()}`,
      id: projectId,
      key,
      ...projectData,
      members,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save project to DynamoDB
    await putItem(project);

    return createCreatedResponse({ project }, 'Project created successfully');

  } catch (error) {
    console.error('Create project error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireRole(['admin', 'manager'])(requireAuth(handler));
