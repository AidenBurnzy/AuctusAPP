const { Client } = require('pg');

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Validate environment variable early
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'NEON_DATABASE_URL environment variable is not set. Please add it in Netlify site settings.'
      })
    };
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        type VARCHAR(50) NOT NULL DEFAULT 'potential',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        start_date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS websites (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT,
        status VARCHAR(50) DEFAULT 'development',
        description TEXT,
        technologies TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ideas (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        priority VARCHAR(50) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS finances (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        transaction_date DATE NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database initialized successfully',
        tables: ['clients', 'projects', 'websites', 'ideas', 'finances']
      })
    };
  } catch (error) {
    // Provide extra guidance for common connection errors
    const message = error && error.message ? error.message : String(error);
    let hint = null;
    if (message.includes('ECONNREFUSED')) {
      hint = 'Connection refused. Ensure the NEON_DATABASE_URL is correct and the Neon project is accessible from Netlify (SSL required).';
    } else if (message.includes('getaddrinfo ENOTFOUND') || message.includes('ENOTFOUND')) {
      hint = 'DNS lookup failed. Verify the host in NEON_DATABASE_URL is correct.';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: message, hint })
    };
  } finally {
    try {
      await client.end();
    } catch (e) {
      // swallow client end errors
    }
  }
};
