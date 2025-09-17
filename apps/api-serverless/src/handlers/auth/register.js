/**
 * Register Lambda handler
 */

const { v4: uuidv4 } = require('uuid');
const { validateUser } = require('../../lib/validation');
const { generateToken, hashPassword } = require('../../lib/auth');
const { createCreatedResponse, createErrorResponse } = require('../../lib/response');
const { query, putItem } = require('../../lib/dynamodb');

exports.handler = async (event) => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const { error, value } = validateUser(body);
    if (error) {
      return createErrorResponse(400, 'Validation failed', error.errors);
    }

    const { name, email, password, role } = value;

    // Check if user already exists
    const existingUsers = await query(
      'GSI1PK = :email',
      { ':email': `EMAIL#${email}` },
      { IndexName: 'GSI1' }
    );

    if (existingUsers.length > 0) {
      return createErrorResponse(409, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = uuidv4();
    const user = {
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
      GSI1PK: `EMAIL#${email}`,
      GSI1SK: `USER#${Date.now()}`,
      id: userId,
      name,
      email,
      password: hashedPassword,
      role: role || 'developer',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user to DynamoDB
    await putItem(user);

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return createCreatedResponse({
      user: userWithoutPassword,
      token
    }, 'User registered successfully');

  } catch (error) {
    console.error('Registration error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
