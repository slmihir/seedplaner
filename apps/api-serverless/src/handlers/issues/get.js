/**
 * Get single issue Lambda handler
 */

const { createSuccessResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { getItem } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    const user = event.user;
    const { id } = event.pathParameters;

    if (!id) {
      return createErrorResponse(400, 'Issue ID is required');
    }

    // Find issue by ID (scan since we don't know the project)
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

    // Check if user is a member of the project or admin
    const isMember = project.members && project.members.includes(user.id);
    if (!isMember && user.role !== 'admin') {
      return createErrorResponse(403, 'You do not have access to this issue');
    }

    // Remove sensitive data
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...cleanIssue } = issue;

    return createSuccessResponse({ issue: cleanIssue });

  } catch (error) {
    console.error('Get issue error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
