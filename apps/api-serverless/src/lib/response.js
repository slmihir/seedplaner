/**
 * Standard response helper for Lambda functions
 */

exports.createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

exports.createErrorResponse = (statusCode, message, details = null) => {
  const body = {
    error: true,
    message,
    ...(details && { details })
  };
  
  return exports.createResponse(statusCode, body);
};

exports.createSuccessResponse = (data, message = null) => {
  const body = {
    success: true,
    data,
    ...(message && { message })
  };
  
  return exports.createResponse(200, body);
};

exports.createCreatedResponse = (data, message = 'Resource created successfully') => {
  const body = {
    success: true,
    data,
    message
  };
  
  return exports.createResponse(201, body);
};

exports.createUpdatedResponse = (data, message = 'Resource updated successfully') => {
  const body = {
    success: true,
    data,
    message
  };
  
  return exports.createResponse(200, body);
};

exports.createDeletedResponse = (message = 'Resource deleted successfully') => {
  const body = {
    success: true,
    message
  };
  
  return exports.createResponse(200, body);
};
