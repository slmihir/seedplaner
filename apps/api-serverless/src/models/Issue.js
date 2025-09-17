/**
 * Issue model for DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const { getItem, putItem, updateItem, deleteItem, query, scan } = require('../lib/dynamodb');

class Issue {
  constructor(data) {
    this.PK = `PROJECT#${data.project}`;
    this.SK = `ISSUE#${data.id}`;
    this.GSI1PK = `USER#${data.createdBy}`;
    this.GSI1SK = `ISSUE#${Date.now()}`;
    this.GSI2PK = `PROJECT#${data.project}`;
    this.GSI2SK = `ISSUE#${data.key}`;
    this.id = data.id;
    this.key = data.key;
    this.title = data.title;
    this.description = data.description || '';
    this.type = data.type;
    this.status = data.status;
    this.priority = data.priority || 'medium';
    this.project = data.project;
    this.sprint = data.sprint || '';
    this.assignees = data.assignees || [];
    this.tags = data.tags || [];
    this.storyPoints = data.storyPoints;
    this.dailyStatus = data.dailyStatus;
    this.acceptanceCriteria = data.acceptanceCriteria || '';
    this.testPlan = data.testPlan || '';
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.estimate = data.estimate;
    this.actual = data.actual;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static async create(issueData) {
    const issueId = uuidv4();
    const issue = new Issue({
      id: issueId,
      ...issueData
    });

    await putItem(issue);
    return issue;
  }

  static async getById(issueId) {
    const issues = await scan(
      'id = :id',
      { ':id': issueId }
    );
    return issues.length > 0 ? issues[0] : null;
  }

  static async getByProject(projectId, filters = {}) {
    let filterExpression = 'PK = :pk';
    const expressionAttributeValues = { ':pk': `PROJECT#${projectId}` };

    if (filters.status) {
      filterExpression += ' AND status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters.type) {
      filterExpression += ' AND type = :type';
      expressionAttributeValues[':type'] = filters.type;
    }

    if (filters.priority) {
      filterExpression += ' AND priority = :priority';
      expressionAttributeValues[':priority'] = filters.priority;
    }

    if (filters.assignee) {
      filterExpression += ' AND contains(assignees, :assignee)';
      expressionAttributeValues[':assignee'] = filters.assignee;
    }

    if (filters.sprint) {
      filterExpression += ' AND sprint = :sprint';
      expressionAttributeValues[':sprint'] = filters.sprint;
    }

    const issues = await query(
      'PK = :pk',
      expressionAttributeValues,
      { FilterExpression: filterExpression }
    );
    return issues;
  }

  static async getByUser(userId, filters = {}) {
    let filterExpression = 'GSI1PK = :user';
    const expressionAttributeValues = { ':user': `USER#${userId}` };

    if (filters.status) {
      filterExpression += ' AND status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters.type) {
      filterExpression += ' AND type = :type';
      expressionAttributeValues[':type'] = filters.type;
    }

    const issues = await query(
      'GSI1PK = :user',
      expressionAttributeValues,
      { 
        IndexName: 'GSI1',
        FilterExpression: filterExpression
      }
    );
    return issues;
  }

  static async getAll(filters = {}) {
    let filterExpression = 'begins_with(SK, :sk)';
    const expressionAttributeValues = { ':sk': 'ISSUE#' };

    if (filters.project) {
      filterExpression += ' AND project = :project';
      expressionAttributeValues[':project'] = filters.project;
    }

    if (filters.status) {
      filterExpression += ' AND status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters.type) {
      filterExpression += ' AND type = :type';
      expressionAttributeValues[':type'] = filters.type;
    }

    if (filters.priority) {
      filterExpression += ' AND priority = :priority';
      expressionAttributeValues[':priority'] = filters.priority;
    }

    if (filters.assignee) {
      filterExpression += ' AND contains(assignees, :assignee)';
      expressionAttributeValues[':assignee'] = filters.assignee;
    }

    if (filters.sprint) {
      filterExpression += ' AND sprint = :sprint';
      expressionAttributeValues[':sprint'] = filters.sprint;
    }

    const issues = await scan(filterExpression, expressionAttributeValues);
    return issues;
  }

  async update(updateData) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      if (key !== 'id' && key !== 'PK' && key !== 'SK') {
        updateExpression.push(`#attr${index} = :val${index}`);
        expressionAttributeNames[`#attr${index}`] = key;
        expressionAttributeValues[`:val${index}`] = updateData[key];
      }
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updatedIssue = await updateItem(
      this.PK,
      this.SK,
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );

    // Update local instance
    Object.assign(this, updatedIssue);
    return this;
  }

  async delete() {
    await deleteItem(this.PK, this.SK);
  }

  async addAssignee(userId) {
    if (!this.assignees.includes(userId)) {
      this.assignees.push(userId);
      await this.update({ assignees: this.assignees });
    }
    return this;
  }

  async removeAssignee(userId) {
    this.assignees = this.assignees.filter(id => id !== userId);
    await this.update({ assignees: this.assignees });
    return this;
  }

  async addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      await this.update({ tags: this.tags });
    }
    return this;
  }

  async removeTag(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.update({ tags: this.tags });
    return this;
  }

  async isAssignedTo(userId) {
    return this.assignees.includes(userId);
  }

  toJSON() {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...issue } = this;
    return issue;
  }
}

module.exports = Issue;
