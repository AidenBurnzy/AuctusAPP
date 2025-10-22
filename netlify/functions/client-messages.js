const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
    const sql = neon(process.env.DATABASE_URL);
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        // GET - Fetch client messages
        if (event.httpMethod === 'GET') {
            const params = event.queryStringParameters || {};
            
            let query;
            if (params.client_id) {
                query = sql`
                    SELECT cm.*, c.name as client_name, c.company
                    FROM client_messages cm
                    JOIN clients c ON cm.client_id = c.id
                    WHERE cm.client_id = ${params.client_id}
                    ORDER BY cm.created_at DESC
                `;
            } else {
                query = sql`
                    SELECT cm.*, c.name as client_name, c.company
                    FROM client_messages cm
                    JOIN clients c ON cm.client_id = c.id
                    ORDER BY cm.created_at DESC
                `;
            }
            
            const messages = await query;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(messages)
            };
        }
        
        // POST - Create new message
        if (event.httpMethod === 'POST') {
            const data = JSON.parse(event.body);
            
            const result = await sql`
                INSERT INTO client_messages 
                (client_id, subject, message, created_by, is_read)
                VALUES (
                    ${data.client_id}, 
                    ${data.subject || null}, 
                    ${data.message}, 
                    ${data.created_by},
                    false
                )
                RETURNING *
            `;
            
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(result[0])
            };
        }
        
        // PUT - Update message (mark as read)
        if (event.httpMethod === 'PUT') {
            const data = JSON.parse(event.body);
            
            const result = await sql`
                UPDATE client_messages
                SET is_read = ${data.is_read}
                WHERE id = ${data.id}
                RETURNING *
            `;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result[0])
            };
        }
        
        // DELETE - Remove message
        if (event.httpMethod === 'DELETE') {
            const id = event.queryStringParameters?.id;
            
            await sql`DELETE FROM client_messages WHERE id = ${id}`;
            
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
    }
};
