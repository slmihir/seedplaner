/**
 * Project model for DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const { getItem, putItem, updateItem, deleteItem, query, scan } = require('../lib/dynamodb');

class Project {
  constructor(data) {
    this.PK = `PROJECT#${data.id}`;
    this.SK = `PROJECT#${data.id}`;
    this.GSI1PK = `KEY#${data.key}`;
    this.GSI1SK = `PROJECT#${Date.now()}`;
    this.GSI2PK = `USER#${data.createdBy}`;
    this.GSI2SK = `PROJECT#${Date.now()}`;
    this.id = data.id;
    this.key = data.key;
    this.name = data.name;
    this.description = data.description || '';
    this.members = data.members || [];
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.status = data.status || 'active';
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static async create(projectData) {
    const projectId = uuidv4();
    const project = new Project({
      id: projectId,
      ...projectData
    });

    await putItem(project);
    return project;
  }

  static async getById(projectId) {
    const project = await getItem(`PROJECT#${projectId}`, `PROJECT#${projectId}`);
    return project;
  }

  static async getByKey(key) {
    const projects = await query(
      'GSI1PK = :key',
      { ':key': `KEY#${key}` },
      { IndexName: 'GSI1' }
    );
    return projects.length > 0 ? projects[0] : null;
  }

  static async getByUser(userId) {
    const projects = await query(
      'GSI2PK = :user',
      { ':user': `USER#${userId}` },
      { IndexName: 'GSI2' }
    );
    return projects;
  }

  static async getAll(filters = {}) {
    let filterExpression = 'begins_with(SK, :sk)';
    const expressionAttributeValues = { ':sk': 'PROJECT#' };

    if (filters.status) {
      filterExpression += ' AND status = :status';
      expressionAttributeValues[':status'] = filters.status;
    }

    if (filters.createdBy) {
      filterExpression += ' AND createdBy = :createdBy';
      expressionAttributeValues[':createdBy'] = filters.createdBy;
    }

    const projects = await scan(filterExpression, expressionAttributeValues);
    return projects;
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

    const updatedProject = await updateItem(
      this.PK,
      this.SK,
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );

    // Update local instance
    Object.assign(this, updatedProject);
    return this;
  }

  async delete() {
    await deleteItem(this.PK, this.SK);
  }

  async addMember(userId) {
    if (!this.members.includes(userId)) {
      this.members.push(userId);
      await this.update({ members: this.members });
    }
    return this;
  }

  async removeMember(userId) {
    this.members = this.members.filter(id => id !== userId);
    await this.update({ members: this.members });
    return this;
  }

  async isMember(userId) {
    return this.members.includes(userId);
  }

  toJSON() {
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...project } = this;
    return project;
  }
}

module.exports = Project;
