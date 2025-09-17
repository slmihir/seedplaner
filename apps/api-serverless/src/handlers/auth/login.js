/**
 * Login Lambda handler
 */

const { validateLogin } = require('../../lib/validation');
const { generateToken, comparePassword } = require('../../lib/auth');
const { createSuccessResponse, createErrorResponse } = require('../../lib/response');
const { query } = require('../../lib/dynamodb');

exports.handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = validateLogin(body);
    if (error) {
      return createErrorResponse(400, 'Validation failed', error.errors);
    }

    const { email, password } = value;

    // Find user by email
    const users = await query(
      'GSI1PK = :email',
      { ':email': `EMAIL#${email}` },
      { IndexName: 'GSI1' }
    );

    if (users.length === 0) {
      return createErrorResponse(401, 'Invalid email or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.isActive) {
      return createErrorResponse(401, 'Account is deactivated');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return createErrorResponse(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return createSuccessResponse({
      user: userWithoutPassword,
      token
    }, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
