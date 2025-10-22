const { Client } = require('pg');
const { validateToken } = require('./auth-helper');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || 'https://auctusventures.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // SECURITY: Require authentication to prevent unauthorized access and reconnaissance
  try {
    validateToken(event);
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized: This endpoint requires authentication' })
    };
  }

  // SECURITY: Disable in production via environment variable
  // Set DB_INIT_ENABLED=false in production once schema is initialized
  if (process.env.DB_INIT_ENABLED !== 'true') {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({
        error: 'Database initialization is disabled. Contact your administrator if you need to reinitialize the database.'
      })
    };
  }

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
        website_id INTEGER REFERENCES websites(id) ON DELETE SET NULL,
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_income (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        monthly_payment DECIMAL(10, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        monthly_cost DECIMAL(10, 2) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS budget_allocations (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        percentage DECIMAL(5, 2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        percentage DECIMAL(5, 2) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        is_completed BOOLEAN DEFAULT false,
        priority VARCHAR(50) DEFAULT 'medium',
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Client Portal Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS client_portal_users (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_updates (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS client_messages (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE
      )
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database initialized successfully',
        tables: ['clients', 'projects', 'websites', 'ideas', 'finances', 'recurring_income', 'subscriptions', 'budget_allocations', 'employees', 'notes', 'client_portal_users', 'client_updates', 'client_messages']
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
