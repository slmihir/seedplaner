/**
 * List projects Lambda handler
 */

const { createSuccessResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { query, scan, encodePaginationToken, decodePaginationToken } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    const user = event.user;
    const queryParams = event.queryStringParameters || {};
    
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      token
    } = queryParams;

    let projects = [];
    let lastKey = null;

    if (user.role === 'admin') {
      // Admin can see all projects
      let filterExpression = 'begins_with(SK, :sk)';
      const expressionAttributeValues = { ':sk': 'PROJECT#' };

      if (status) {
        filterExpression += ' AND status = :status';
        expressionAttributeValues[':status'] = status;
      }

      const scanOptions = {
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: parseInt(limit)
      };

      // Handle pagination
      if (token) {
        scanOptions.ExclusiveStartKey = decodePaginationToken(token);
      }

      const result = await scan(filterExpression, expressionAttributeValues, scanOptions);
      projects = result.Items || result;
      lastKey = result.LastEvaluatedKey;

    } else {
      // Non-admin users can only see projects they're members of
      const keyConditionExpression = 'GSI2PK = :user';
      const expressionAttributeValues = { ':user': `USER#${user.id}` };

      let filterExpression = '';
      if (status) {
        filterExpression = 'status = :status';
        expressionAttributeValues[':status'] = status;
      }

      const queryOptions = {
        IndexName: 'GSI2',
        FilterExpression: filterExpression || undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: parseInt(limit)
      };

      // Handle pagination
      if (token) {
        queryOptions.ExclusiveStartKey = decodePaginationToken(token);
      }

      const result = await query(keyConditionExpression, expressionAttributeValues, queryOptions);
      projects = result.Items || result;
      lastKey = result.LastEvaluatedKey;
    }

    // Sort projects (client-side sorting for simplicity)
    projects.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Remove sensitive data
    const sanitizedProjects = projects.map(project => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...cleanProject } = project;
      return cleanProject;
    });

    const response = {
      projects: sanitizedProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sanitizedProjects.length,
        hasMore: !!lastKey,
        nextToken: lastKey ? encodePaginationToken(lastKey) : null
      }
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('List projects error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
