/**
 * List issues Lambda handler
 */

const { createSuccessResponse, createErrorResponse } = require('../../lib/response');
const { requireAuth } = require('../../lib/auth');
const { query, scan, encodePaginationToken, decodePaginationToken } = require('../../lib/dynamodb');

const handler = async (event) => {
  try {
    const user = event.user;
    const queryParams = event.queryStringParameters || {};
    
    const {
      project,
      sprint,
      type,
      status,
      priority,
      assignee,
      reporter,
      q: searchQuery,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      token
    } = queryParams;

    let issues = [];
    let lastKey = null;

    // Build filter conditions
    const filterConditions = [];
    const expressionAttributeValues = {};

    if (project && project !== 'all') {
      // Query by project
      const keyConditionExpression = 'PK = :pk';
      expressionAttributeValues[':pk'] = `PROJECT#${project}`;
      
      let filterExpression = '';
      if (sprint) {
        filterExpression = 'sprint = :sprint';
        expressionAttributeValues[':sprint'] = sprint;
      }
      if (type) {
        filterExpression += filterExpression ? ' AND type = :type' : 'type = :type';
        expressionAttributeValues[':type'] = type;
      }
      if (status) {
        filterExpression += filterExpression ? ' AND status = :status' : 'status = :status';
        expressionAttributeValues[':status'] = status;
      }
      if (priority) {
        filterExpression += filterExpression ? ' AND priority = :priority' : 'priority = :priority';
        expressionAttributeValues[':priority'] = priority;
      }
      if (assignee) {
        filterExpression += filterExpression ? ' AND contains(assignees, :assignee)' : 'contains(assignees, :assignee)';
        expressionAttributeValues[':assignee'] = assignee;
      }
      if (reporter) {
        filterExpression += filterExpression ? ' AND createdBy = :reporter' : 'createdBy = :reporter';
        expressionAttributeValues[':reporter'] = reporter;
      }
      if (searchQuery) {
        filterExpression += filterExpression ? ' AND contains(title, :search)' : 'contains(title, :search)';
        expressionAttributeValues[':search'] = searchQuery;
      }
      if (tags) {
        const tagList = tags.split(',');
        filterExpression += filterExpression ? ' AND contains(tags, :tags)' : 'contains(tags, :tags)';
        expressionAttributeValues[':tags'] = tagList[0]; // DynamoDB limitation - can only check one tag at a time
      }

      const queryOptions = {
        FilterExpression: filterExpression || undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: parseInt(limit)
      };

      // Handle pagination
      if (token) {
        queryOptions.ExclusiveStartKey = decodePaginationToken(token);
      }

      const result = await query(keyConditionExpression, expressionAttributeValues, queryOptions);
      issues = result.Items || result;
      lastKey = result.LastEvaluatedKey;

    } else {
      // Scan all issues (admin only or if no project filter)
      if (user.role !== 'admin' && !project) {
        return createErrorResponse(403, 'Project filter is required for non-admin users');
      }

      let filterExpression = 'begins_with(SK, :sk)';
      expressionAttributeValues[':sk'] = 'ISSUE#';

      if (sprint) {
        filterExpression += ' AND sprint = :sprint';
        expressionAttributeValues[':sprint'] = sprint;
      }
      if (type) {
        filterExpression += ' AND type = :type';
        expressionAttributeValues[':type'] = type;
      }
      if (status) {
        filterExpression += ' AND status = :status';
        expressionAttributeValues[':status'] = status;
      }
      if (priority) {
        filterExpression += ' AND priority = :priority';
        expressionAttributeValues[':priority'] = priority;
      }
      if (assignee) {
        filterExpression += ' AND contains(assignees, :assignee)';
        expressionAttributeValues[':assignee'] = assignee;
      }
      if (reporter) {
        filterExpression += ' AND createdBy = :reporter';
        expressionAttributeValues[':reporter'] = reporter;
      }
      if (searchQuery) {
        filterExpression += ' AND contains(title, :search)';
        expressionAttributeValues[':search'] = searchQuery;
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
      issues = result.Items || result;
      lastKey = result.LastEvaluatedKey;
    }

    // Sort issues (client-side sorting for simplicity)
    issues.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Remove sensitive data
    const sanitizedIssues = issues.map(issue => {
      const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...cleanIssue } = issue;
      return cleanIssue;
    });

    const response = {
      issues: sanitizedIssues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: sanitizedIssues.length,
        hasMore: !!lastKey,
        nextToken: lastKey ? encodePaginationToken(lastKey) : null
      }
    };

    return createSuccessResponse(response);

  } catch (error) {
    console.error('List issues error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

exports.handler = requireAuth(handler);
