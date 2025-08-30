
const { Pool } = require('pg');

// Database connection pool
let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    return pool;
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
            },
            body: ''
        };
    }

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    };

    try {
        const client = getPool();
        let body;
        
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }

        const { action, user_id, email, display_name } = body;

        switch (action) {
            case 'create':
                return await createUserProfile(client, { user_id, email, display_name }, headers);
            case 'get':
                return await getUserProfile(client, user_id, headers);
            case 'update':
                return await updateUserProfile(client, { user_id, email, display_name }, headers);
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action. Supported actions: create, get, update' })
                };
        }

    } catch (error) {
        console.error('Lambda error:', error);
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

async function createUserProfile(client, { user_id, email, display_name }, headers) {
    if (!user_id || !email) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'user_id and email are required' })
        };
    }

    try {
        // Check if user already exists
        const existingUser = await client.query(
            'SELECT user_id FROM user_profiles WHERE user_id = $1',
            [user_id]
        );

        if (existingUser.rows.length > 0) {
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'User profile already exists' })
            };
        }

        // Create new user profile
        const result = await client.query(
            `INSERT INTO user_profiles (user_id, email, display_name) 
             VALUES ($1, $2, $3) 
             RETURNING user_id, email, display_name, created_at`,
            [user_id, email, display_name]
        );

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'User profile created successfully',
                user: result.rows[0]
            })
        };
    } catch (error) {
        console.error('Database error:', error);
        if (error.code === '23505') { // Unique constraint violation
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'User profile already exists' })
            };
        }
        throw error;
    }
}

async function getUserProfile(client, user_id, headers) {
    if (!user_id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'user_id is required' })
        };
    }

    try {
        const result = await client.query(
            `SELECT user_id, email, display_name, created_at, updated_at 
             FROM user_profiles 
             WHERE user_id = $1`,
            [user_id]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User profile not found' })
            };
        }


        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                user: result.rows[0]
            })
        };
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    }
}

async function updateUserProfile(client, { user_id, email, display_name }, headers) {
    if (!user_id) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'user_id is required' })
        };
    }

    try {
        const updateFields = [];
        const values = [];
        let paramIndex = 1;

        if (email) {
            updateFields.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        
        if (display_name) {
            updateFields.push(`display_name = $${paramIndex++}`);
            values.push(display_name);
        }

        if (updateFields.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'At least one field to update is required' })
            };
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(user_id);

        const result = await client.query(
            `UPDATE user_profiles 
             SET ${updateFields.join(', ')} 
             WHERE user_id = $${paramIndex} 
             RETURNING user_id, email, display_name, updated_at`,
            values
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'User profile not found' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'User profile updated successfully',
                user: result.rows[0]
            })
        };
    } catch (error) {
        console.error('Database error:', error);
        if (error.code === '23505') { // Unique constraint violation
            return {
                statusCode: 409,
                headers,
                body: JSON.stringify({ error: 'Email already exists' })
            };
        }
        throw error;
    }
}
