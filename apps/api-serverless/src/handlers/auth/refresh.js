/**
 * Refresh token Lambda handler
 */

const { generateToken } = require('../../lib/auth');
const { createSuccessResponse, createErrorResponse } = require('../../lib/response');
const { authenticate } = require('../../lib/auth');

exports.handler = async (event) => {
  try {
    // Authenticate user
    const user = await authenticate(event.headers.Authorization);
    
    if (!user) {
      return createErrorResponse(401, 'Invalid or expired token');
    }

    // Generate new token
    const token = generateToken(user);

    return createSuccessResponse({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, 'Token refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
