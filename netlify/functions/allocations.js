const { Client } = require('pg');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
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
      const result = await client.query('SELECT * FROM budget_allocations ORDER BY category ASC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { category, percentage, description } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO budget_allocations (category, percentage, description) VALUES ($1, $2, $3) RETURNING *',
        [category, percentage, description || null]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, category, percentage, description } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE budget_allocations SET category=$1, percentage=$2, description=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
        [category, percentage, description, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM budget_allocations WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};
