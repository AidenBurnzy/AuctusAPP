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

    // GET - Fetch all client portal users or authenticate
    if (event.httpMethod === 'GET') {
      const params = event.queryStringParameters || {};
      
      // Login authentication
      if (params.username && params.password) {
        const result = await client.query(`
          SELECT cpu.*, c.name as client_name, c.company, c.email, c.phone
          FROM client_portal_users cpu
          JOIN clients c ON cpu.client_id = c.id
          WHERE cpu.username = $1 AND cpu.password = $2
        `, [params.username, params.password]);
        
        if (result.rows.length > 0) {
          // Update last login
          await client.query(
            'UPDATE client_portal_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [result.rows[0].id]
          );
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
              success: true, 
              user: result.rows[0] 
            })
          };
        } else {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ 
              success: false, 
              message: 'Invalid credentials' 
            })
          };
        }
      }
      
      // Get all users (admin view)
      const result = await client.query(`
        SELECT cpu.*, c.name as client_name, c.company, c.email
        FROM client_portal_users cpu
        JOIN clients c ON cpu.client_id = c.id
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
      
      // Check if client already has portal access
      const existing = await client.query(
        'SELECT * FROM client_portal_users WHERE client_id = $1',
        [data.client_id]
      );
      
      if (existing.rows.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Client already has portal access' 
          })
        };
      }
      
      const result = await client.query(
        `INSERT INTO client_portal_users (client_id, username, password)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [data.client_id, data.username, data.password]
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
      
      const result = await client.query(
        `UPDATE client_portal_users
        SET username = $1, password = $2
        WHERE id = $3
        RETURNING *`,
        [data.username, data.password, data.id]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    // DELETE - Remove client portal user
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      
      await client.query('DELETE FROM client_portal_users WHERE id = $1', [id]);
      
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
