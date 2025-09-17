/**
 * DynamoDB client and utilities
 */

const { DynamoDB } = require('aws-sdk');

const dynamodb = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-west-2'
});

const TABLE_NAME = process.env.DYNAMODB_TABLE;

/**
 * Get item by primary key
 */
exports.getItem = async (PK, SK) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK, SK }
  };

  const result = await dynamodb.get(params).promise();
  return result.Item;
};

/**
 * Put item
 */
exports.putItem = async (item) => {
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };

  return dynamodb.put(params).promise();
};

/**
 * Update item
 */
exports.updateItem = async (PK, SK, updateExpression, expressionAttributeNames, expressionAttributeValues) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK, SK },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

/**
 * Delete item
 */
exports.deleteItem = async (PK, SK) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { PK, SK }
  };

  return dynamodb.delete(params).promise();
};

/**
 * Query items by primary key
 */
exports.query = async (keyConditionExpression, expressionAttributeValues, options = {}) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...options
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
};

/**
 * Query items by GSI
 */
exports.queryGSI = async (indexName, keyConditionExpression, expressionAttributeValues, options = {}) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...options
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
};

/**
 * Scan table with filters
 */
exports.scan = async (filterExpression, expressionAttributeValues, options = {}) => {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ...options
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items;
};

/**
 * Batch get items
 */
exports.batchGet = async (keys) => {
  const params = {
    RequestItems: {
      [TABLE_NAME]: {
        Keys: keys
      }
    }
  };

  const result = await dynamodb.batchGet(params).promise();
  return result.Responses[TABLE_NAME];
};

/**
 * Batch write items
 */
exports.batchWrite = async (items, operation = 'PutRequest') => {
  const params = {
    RequestItems: {
      [TABLE_NAME]: items.map(item => ({
        [operation]: operation === 'PutRequest' ? { Item: item } : { Key: item }
      }))
    }
  };

  return dynamodb.batchWrite(params).promise();
};

/**
 * Paginate through results
 */
exports.paginate = async (queryFunction, limit = 20, lastKey = null) => {
  const options = { Limit: limit };
  if (lastKey) {
    options.ExclusiveStartKey = lastKey;
  }

  const result = await queryFunction(options);
  
  return {
    items: result.Items || result,
    lastKey: result.LastEvaluatedKey,
    hasMore: !!result.LastEvaluatedKey
  };
};

/**
 * Generate pagination token
 */
exports.encodePaginationToken = (lastKey) => {
  if (!lastKey) return null;
  return Buffer.from(JSON.stringify(lastKey)).toString('base64');
};

/**
 * Decode pagination token
 */
exports.decodePaginationToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch (error) {
    return null;
  }
};
