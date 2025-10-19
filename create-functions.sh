#!/bin/bash

# Projects API
cat > netlify/functions/projects.js << 'ENDJS'
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
      const result = await client.query('SELECT * FROM projects ORDER BY created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { name, client_id, status, progress, start_date, description } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO projects (name, client_id, status, progress, start_date, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, client_id || null, status || 'active', progress || 0, start_date, description]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, client_id, status, progress, start_date, description } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE projects SET name=$1, client_id=$2, status=$3, progress=$4, start_date=$5, description=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
        [name, client_id || null, status, progress, start_date, description, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM projects WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};
ENDJS

# Websites API
cat > netlify/functions/websites.js << 'ENDJS'
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
      const result = await client.query('SELECT * FROM websites ORDER BY created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { name, url, status, description, technologies } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO websites (name, url, status, description, technologies) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, url, status || 'development', description, technologies]
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, name, url, status, description, technologies } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE websites SET name=$1, url=$2, status=$3, description=$4, technologies=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
        [name, url, status, description, technologies, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM websites WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};
ENDJS

# Ideas API
cat > netlify/functions/ideas.js << 'ENDJS'
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
      const result = await client.query('SELECT * FROM ideas ORDER BY created_at DESC');
      return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
    }

    if (event.httpMethod === 'POST') {
      const { title, content, category, priority } = JSON.parse(event.body);
      const result = await client.query(
        'INSERT INTO ideas (title, content, category, priority) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, category, priority || 'medium']
      );
      return { statusCode: 201, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'PUT') {
      const { id, title, content, category, priority } = JSON.parse(event.body);
      const result = await client.query(
        'UPDATE ideas SET title=$1, content=$2, category=$3, priority=$4, updated_at=NOW() WHERE id=$5 RETURNING *',
        [title, content, category, priority, id]
      );
      return { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
    }

    if (event.httpMethod === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await client.query('DELETE FROM ideas WHERE id=$1', [id]);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.end();
  }
};
ENDJS

echo "All API functions created successfully!"
