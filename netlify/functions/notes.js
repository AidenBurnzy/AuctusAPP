const { Client } = require('pg');
const { validateToken } = require('./auth-helper');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://auctusventures.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

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

    // GET - Fetch all notes
    if (event.httpMethod === 'GET') {
      const result = await client.query(
        'SELECT * FROM notes ORDER BY is_completed ASC, created_at DESC'
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Create new note
    if (event.httpMethod === 'POST') {
      const { title, content, priority, created_by } = JSON.parse(event.body);
      const result = await client.query(
        `INSERT INTO notes (title, content, priority, created_by, is_completed) 
         VALUES ($1, $2, $3, $4, false) RETURNING *`,
        [title, content || '', priority || 'medium', created_by || 'Owner']
      );
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // PUT - Update note
    if (event.httpMethod === 'PUT') {
      const { id, title, content, is_completed, priority } = JSON.parse(event.body);
      const result = await client.query(
        `UPDATE notes 
         SET title = $1, content = $2, is_completed = $3, priority = $4, updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [title, content, is_completed, priority, id]
      );
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Delete note
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM notes WHERE id = $1', [id]);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Notes API error:', error);
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
