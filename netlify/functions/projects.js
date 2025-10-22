const { Client } = require('pg');
const { validateToken } = require('./auth-helper');

const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://auctusventures.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const result = await client.query('SELECT * FROM projects ORDER BY created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { name, client_id, status, progress, start_date, description } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO projects (name, client_id, status, progress, start_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, client_id || null, status || 'active', progress || 0, start_date, description]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, client_id, status, progress, start_date, description } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE projects SET name=$1, client_id=$2, status=$3, progress=$4, start_date=$5, description=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
        [name, client_id || null, status, progress, start_date, description, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM projects WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Projects API error:', error);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: 'An error occurred processing your request',
        ...(process.env.DEBUG === 'true' && { details: error.message })
      })
    };
  } finally {
    await client.end();
  }
};
