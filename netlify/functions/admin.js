const { validateToken } = require('./auth-helper');

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://auctusventures.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Validate authentication token
  try {
    validateToken(event);
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
    };
  }

  try {
    const { action, adminCode } = JSON.parse(event.body);

    if (action === 'validate-admin-code') {
      const ADMIN_CODE = process.env.ADMIN_CODE || 'your-secret-admin-code';
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: adminCode === ADMIN_CODE })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Unknown action' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
