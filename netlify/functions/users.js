const { Client } = require('pg');
const { validateToken } = require('./auth-helper');

exports.handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://auctusventures.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }

  try {
    if (event.httpMethod === 'POST') {
      // Create or update user
      const body = JSON.parse(event.body);
      console.log('Received user data:', JSON.stringify(body, null, 2));
      
      const { auth0_id, email, firstName, lastName, phone, picture } = body;
      
      if (!auth0_id || !email) {
        console.error('Missing required fields:', { auth0_id, email });
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields: auth0_id and email are required' })
        };
      }
      
      // SECURITY: Role is determined server-side, NOT from client input
      // Default new users to 'user' role - only admins can be promoted via database/admin panel
      const serverAssignedRole = 'user';
      
      const query = `
        INSERT INTO users (auth0_id, email, first_name, last_name, phone, role, picture)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (auth0_id) 
        DO UPDATE SET 
          email = $2, 
          first_name = $3, 
          last_name = $4, 
          phone = $5, 
          picture = $7,
          updated_at = NOW()
        RETURNING *
      `;
      
      console.log('Executing query with params:', [auth0_id, email, firstName, lastName, phone, serverAssignedRole, picture]);
      const result = await client.query(query, [auth0_id, email, firstName, lastName, phone, serverAssignedRole, picture]);
      console.log('Query successful, user created/updated:', result.rows[0]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    } else if (event.httpMethod === 'GET') {
      // Get user profile
      const auth0_id = event.queryStringParameters?.auth0_id;
      
      if (!auth0_id) {
        console.error('Missing auth0_id parameter');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required parameter: auth0_id' })
        };
      }
      
      console.log('Fetching user profile for:', auth0_id);
      const result = await client.query('SELECT * FROM users WHERE auth0_id = $1', [auth0_id]);
      console.log('User profile query result:', result.rows[0]);
      
      if (!result.rows[0]) {
        console.warn('User not found:', auth0_id);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    await client.end();
  }
};
