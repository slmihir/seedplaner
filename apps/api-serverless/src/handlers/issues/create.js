/**
 * Create issue Lambda handler
 */

const { v4: uuidv4 } = require('uuid');
const { validateIssue } = require('../../lib/validation');
const { createCreatedResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { getItem, putItem, query } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = validateIssue(body);
    if (error) {
      return createErrorResponse(400, 'Validation failed', error.errors);
    }

    const user = event.user;
    const { project, assignees, ...issueData } = value;

    // Verify project exists and user has access
    const projectItem = await getItem(`PROJECT#${project}`, `PROJECT#${project}`);
    if (!projectItem) {
      return createErrorResponse(404, 'Project not found');
    }

    // Check if user is a member of the project
    const isMember = projectItem.members && projectItem.members.includes(user.id);
    if (!isMember && user.role !== 'admin') {
      return createErrorResponse(403, 'You are not a member of this project');
    }

    // Validate assignees if provided
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        if (!projectItem.members || !projectItem.members.includes(assigneeId)) {
          return createErrorResponse(400, `Assignee ${assigneeId} must be a project member`);
        }
      }
    }

    // Generate sequential issue key
    const lastIssues = await query(
      'PK = :pk AND begins_with(SK, :sk)',
      { 
        ':pk': `PROJECT#${project}`,
        ':sk': 'ISSUE#'
      }
    );

    let nextNumber = 1001;
    if (lastIssues.length > 0) {
      const lastIssue = lastIssues.reduce((latest, issue) => {
        const issueNumber = parseInt(issue.key?.split('-')[1]) || 0;
        const latestNumber = parseInt(latest.key?.split('-')[1]) || 0;
        return issueNumber > latestNumber ? issue : latest;
      });
      
      if (lastIssue.key) {
        const lastNumber = parseInt(lastIssue.key.split('-')[1]) || 1000;
        nextNumber = lastNumber + 1;
      }
    }

    const issueKey = `${projectItem.key}-${nextNumber}`;

    // Create issue
    const issueId = uuidv4();
    const issue = {
      PK: `PROJECT#${project}`,
      SK: `ISSUE#${issueId}`,
      GSI1PK: `USER#${user.id}`,
      GSI1SK: `ISSUE#${Date.now()}`,
      GSI2PK: `PROJECT#${project}`,
      GSI2SK: `ISSUE#${issueKey}`,
      id: issueId,
      key: issueKey,
      ...issueData,
      project,
      assignees: assignees || [],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save issue to DynamoDB
    await putItem(issue);

    return createCreatedResponse({ issue }, 'Issue created successfully');

  } catch (error) {
    console.error('Create issue error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
