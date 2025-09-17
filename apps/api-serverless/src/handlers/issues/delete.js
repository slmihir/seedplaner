/**
 * Delete issue Lambda handler
 */

const { createDeletedResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { getItem, deleteItem, scan } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    const user = event.user;
    const { id } = event.pathParameters;

    if (!id) {
      return createErrorResponse(400, 'Issue ID is required');
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

    // Check permissions - only admin, project manager, or issue creator can delete
    const isMember = project.members && project.members.includes(user.id);
    const isCreator = issue.createdBy === user.id;
    
    if (!isMember && user.role !== 'admin') {
      return createErrorResponse(403, 'You do not have access to this issue');
    }

    // Only admin, manager, or creator can delete
    if (user.role !== 'admin' && user.role !== 'manager' && !isCreator) {
      return createErrorResponse(403, 'You do not have permission to delete this issue');
    }

    // Delete issue from DynamoDB
    await deleteItem(issue.PK, issue.SK);

    return createDeletedResponse('Issue deleted successfully');

  } catch (error) {
    console.error('Delete issue error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
