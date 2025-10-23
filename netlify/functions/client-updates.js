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

    // GET - Fetch updates (with optional client_id filter)
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      const client_id = params.client_id;
      
      let query = `
        SELECT cu.*, c.name as client_name, c.company
        FROM client_updates cu
        LEFT JOIN clients c ON cu.client_id = c.id
      `;
      
      if (client_id) {
        query += ` WHERE cu.client_id = $1 OR cu.client_id IS NULL`;
        const result = await client.query(query + ' ORDER BY cu.created_at DESC', [client_id]);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      } else {
        const result = await client.query(query + ' ORDER BY cu.created_at DESC');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }
    }

    // POST - Create new update
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { client_id, title, content, type, posted_by, created_by } = data;
      
      // Accept both posted_by and created_by for compatibility
      const author = posted_by || created_by || 'Admin';
      
      const result = await client.query(
        `INSERT INTO client_updates 
        (client_id, title, content, type, created_by) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [client_id || null, title, content, type || 'update', author]
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // PUT - Update an update
    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      const { id, title, content, type } = data;
      
      const result = await client.query(
        `UPDATE client_updates 
         SET title = $1, content = $2, type = $3, updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [title, content, type, id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Delete update
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM client_updates WHERE id = $1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Update deleted successfully' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};
