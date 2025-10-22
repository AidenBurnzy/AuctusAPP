// JWT Validation Helper for Netlify Functions
// Import this in your API functions to protect endpoints

const jwt = require('jsonwebtoken');

/**
 * Validates JWT token from Authorization header
 * @param {object} event - Netlify function event object
 * @returns {object} Decoded token with user info
 * @throws {Error} If token is missing, invalid, or expired
 */
function validateToken(event) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const authHeader = event.headers.authorization;
  
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
}

module.exports = { validateToken };
