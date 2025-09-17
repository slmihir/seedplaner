/**
 * User model for DynamoDB
 */

const { v4: uuidv4 } = require('uuid');
const { getItem, putItem, updateItem, deleteItem, query } = require('../lib/dynamodb');
const { hashPassword, comparePassword } = require('../lib/auth');

class User {
  constructor(data) {
    this.PK = `USER#${data.id}`;
    this.SK = `USER#${data.id}`;
    this.GSI1PK = `EMAIL#${data.email}`;
    this.GSI1SK = `USER#${Date.now()}`;
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || 'developer';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  static async create(userData) {
    const userId = uuidv4();
    const user = new User({
      id: userId,
      ...userData,
      password: await hashPassword(userData.password)
    });

    await putItem(user);
    return user;
  }

  static async getById(userId) {
    const user = await getItem(`USER#${userId}`, `USER#${userId}`);
    return user;
  }

  static async getByEmail(email) {
    const users = await query(
      'GSI1PK = :email',
      { ':email': `EMAIL#${email}` },
      { IndexName: 'GSI1' }
    );
    return users.length > 0 ? users[0] : null;
  }

  static async getAll(filters = {}) {
    let filterExpression = 'begins_with(SK, :sk)';
    const expressionAttributeValues = { ':sk': 'USER#' };

    if (filters.role) {
      filterExpression += ' AND role = :role';
      expressionAttributeValues[':role'] = filters.role;
    }

    if (filters.isActive !== undefined) {
      filterExpression += ' AND isActive = :isActive';
      expressionAttributeValues[':isActive'] = filters.isActive;
    }

    const users = await scan(filterExpression, expressionAttributeValues);
    return users;
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

    const updatedUser = await updateItem(
      this.PK,
      this.SK,
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues
    );

    // Update local instance
    Object.assign(this, updatedUser);
    return this;
  }

  async delete() {
    await deleteItem(this.PK, this.SK);
  }

  async verifyPassword(password) {
    return comparePassword(password, this.password);
  }

  toJSON() {
    const { password, PK, SK, GSI1PK, GSI1SK, ...user } = this;
    return user;
  }
}

module.exports = User;
