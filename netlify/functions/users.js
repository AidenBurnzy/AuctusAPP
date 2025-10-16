const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    if (event.httpMethod === 'POST') {
      // Create or update user
      const { auth0_id, email, firstName, lastName, phone, role, picture } = JSON.parse(event.body);
      
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
      
      const result = await client.query(query, [auth0_id, email, firstName, lastName, phone, role || 'user', picture]);
      
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    } else if (event.httpMethod === 'GET') {
      // Get user profile
      const auth0_id = event.queryStringParameters.auth0_id;
      const result = await client.query('SELECT * FROM users WHERE auth0_id = $1', [auth0_id]);
      
      return {
        statusCode: 200,
        body: JSON.stringify(result.rows[0])
      };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};
