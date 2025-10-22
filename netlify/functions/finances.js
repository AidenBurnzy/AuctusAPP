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
      const result = await client.query('SELECT * FROM finances ORDER BY transaction_date DESC, created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { type, category, amount, description, client_id, project_id, transaction_date, payment_method, status } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO finances (type, category, amount, description, client_id, project_id, transaction_date, payment_method, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [type, category, amount, description, client_id || null, project_id || null, transaction_date, payment_method || 'cash', status || 'completed']
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, type, category, amount, description, client_id, project_id, transaction_date, payment_method, status } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE finances SET type=$1, category=$2, amount=$3, description=$4, client_id=$5, project_id=$6, transaction_date=$7, payment_method=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
        [type, category, amount, description, client_id || null, project_id || null, transaction_date, payment_method, status, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM finances WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    console.error('Finances API error:', error);
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
