const { Client } = require('pg');

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

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const result = await client.query('SELECT * FROM websites ORDER BY created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { name, url, status, description, technologies } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO websites (name, url, status, description, technologies) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, url, status || 'development', description, technologies]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, url, status, description, technologies } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE websites SET name=$1, url=$2, status=$3, description=$4, technologies=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
        [name, url, status, description, technologies, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM websites WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Websites API error:', error);
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
