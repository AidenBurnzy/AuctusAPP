const { Client } = require('pg');

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to connect to database', details: error.message })
    };
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        auth0_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'user',
        picture TEXT,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Database initialized successfully' })
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, details: error.stack })
    };
  } finally {
    await client.end();
  }
};
