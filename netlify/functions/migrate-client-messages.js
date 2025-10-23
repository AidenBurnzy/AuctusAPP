const { Client } = require('pg');

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
        
        // Check if column exists
        const columnCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='client_messages' AND column_name='is_archived'
        `);
        
        if (columnCheck.rows.length === 0) {
            // Add the is_archived column
            await client.query(`
                ALTER TABLE client_messages 
                ADD COLUMN is_archived BOOLEAN DEFAULT FALSE
            `);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Added is_archived column to client_messages table' 
                })
            };
        } else {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'Column is_archived already exists' 
                })
            };
        }
    } catch (error) {
        console.error('Migration error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Migration failed',
                details: error.message 
            })
        };
    } finally {
        await client.end();
    }
};
