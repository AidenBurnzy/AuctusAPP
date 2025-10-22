const { Client } = require('pg');

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
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
        
        // GET - Fetch client messages
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            
            let query;
            let values;
            
            if (params.client_id) {
                query = `
                    SELECT cm.*, c.name as client_name, c.company
                    FROM client_messages cm
                    JOIN clients c ON cm.client_id = c.id
                    WHERE cm.client_id = $1
                    ORDER BY cm.created_at DESC
                `;
                values = [params.client_id];
            } else {
                query = `
                    SELECT cm.*, c.name as client_name, c.company
                    FROM client_messages cm
                    JOIN clients c ON cm.client_id = c.id
                    ORDER BY cm.created_at DESC
                `;
                values = [];
            }
            
            const result = await client.query(query, values);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows)
            };
        }
        
        // POST - Create new message
        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            
            const result = await client.query(
                `INSERT INTO client_messages 
                (client_id, subject, message, created_by, is_read)
                VALUES ($1, $2, $3, $4, false)
                RETURNING *`,
                [data.client_id, data.subject || null, data.message, data.created_by]
            );
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }
        
        // PUT - Update message (mark as read)
        if (event.httpMethod === 'PUT') {
            const data = JSON.parse(event.body);
            
            const result = await client.query(
                `UPDATE client_messages
                SET is_read = $1
                WHERE id = $2
                RETURNING *`,
                [data.is_read, data.id]
            );
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.rows[0])
            };
        }
        
        // DELETE - Remove message
        if (event.httpMethod === 'DELETE') {
            const id = event.queryStringParameters?.id;
            
            await client.query('DELETE FROM client_messages WHERE id = $1', [id]);
            
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
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error.message 
            })
        };
    } finally {
        await client.end();
    }
};
