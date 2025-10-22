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
      const result = await client.query('SELECT * FROM subscriptions ORDER BY name ASC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { name, monthly_cost, description, is_active } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO subscriptions (name, monthly_cost, description, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, monthly_cost, description || null, is_active !== false]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, monthly_cost, description, is_active } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE subscriptions SET name=$1, monthly_cost=$2, description=$3, is_active=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
        [name, monthly_cost, description, is_active, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM subscriptions WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Subscriptions API error:', error);
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
