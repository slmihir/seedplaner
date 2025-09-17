/**
 * Update issue Lambda handler
 */

const { validateIssueUpdate } = require('../../lib/validation');
const { createUpdatedResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { getItem, updateItem, scan } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    const user = event.user;
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    if (!id) {
      return createErrorResponse(400, 'Issue ID is required');
    }

    // Validate input
    const { error, value } = validateIssueUpdate(body);
    if (error) {
      return createErrorResponse(400, 'Validation failed', error.errors);
    }

    // Find issue by ID
    const issues = await scan(
      'id = :id',
      { ':id': id }
    );

    if (issues.length === 0) {
      return createErrorResponse(404, 'Issue not found');
    }

    const issue = issues[0];

    // Check if user has access to this issue's project
    const projectId = issue.project;
    const project = await getItem(`PROJECT#${projectId}`, `PROJECT#${projectId}`);
    
    if (!project) {
      return createErrorResponse(404, 'Project not found');
    }

    // Check permissions
    const isMember = project.members && project.members.includes(user.id);
    const isAssignee = issue.assignees && issue.assignees.includes(user.id);
    const isCreator = issue.createdBy === user.id;
    
    if (!isMember && user.role !== 'admin') {
      return createErrorResponse(403, 'You do not have access to this issue');
    }

    // Check if user can update (member, assignee, creator, or admin)
    if (!isMember && !isAssignee && !isCreator && user.role !== 'admin') {
      return createErrorResponse(403, 'You do not have permission to update this issue');
    }

    // Validate assignees if provided
    if (value.assignees && value.assignees.length > 0) {
      for (const assigneeId of value.assignees) {
        if (!project.members || !project.members.includes(assigneeId)) {
          return createErrorResponse(400, `Assignee ${assigneeId} must be a project member`);
        }
      }
    }

    // Build update expression
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(value).forEach((key, index) => {
      updateExpression.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value[key];
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Update issue in DynamoDB
    const updatedIssue = await updateItem(
      issue.PK,
      issue.SK,
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );

    // Remove sensitive data
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...cleanIssue } = updatedIssue;

    return createUpdatedResponse({ issue: cleanIssue }, 'Issue updated successfully');

  } catch (error) {
    console.error('Update issue error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
