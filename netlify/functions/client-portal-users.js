const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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

    // GET - Fetch all client portal users (admin only)
    if (event.httpMethod === 'GET') {
      const result = await client.query(`
        SELECT cpu.*, c.name as client_name, c.company
        FROM client_portal_users cpu
        LEFT JOIN clients c ON cpu.client_id = c.id
        ORDER BY cpu.created_at DESC
      `);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Create new client portal user
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const { client_id, username, password, email, full_name } = data;
      
      // Hash password
      const password_hash = await bcrypt.hash(password, 10);
      
      const result = await client.query(
        `INSERT INTO client_portal_users 
        (client_id, username, password_hash, email, full_name, is_active) 
        VALUES ($1, $2, $3, $4, $5, true) 
        RETURNING *`,
        [client_id, username, password_hash, email, full_name]
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // PUT - Update client portal user
    if (event.httpMethod === 'PUT') {
      const data = JSON.parse(event.body);
      const { id, username, email, full_name, is_active, password } = data;
      
      let query, params;
      
      if (password) {
        // Update with new password
        const password_hash = await bcrypt.hash(password, 10);
        query = `UPDATE client_portal_users 
                 SET username = $1, email = $2, full_name = $3, is_active = $4, password_hash = $5, updated_at = NOW() 
                 WHERE id = $6 
                 RETURNING *`;
        params = [username, email, full_name, is_active, password_hash, id];
      } else {
        // Update without password change
        query = `UPDATE client_portal_users 
                 SET username = $1, email = $2, full_name = $3, is_active = $4, updated_at = NOW() 
                 WHERE id = $5 
                 RETURNING *`;
        params = [username, email, full_name, is_active, id];
      }
      
      const result = await client.query(query, params);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Delete client portal user
    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM client_portal_users WHERE id = $1', [id]);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Client portal user deleted successfully' })
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
