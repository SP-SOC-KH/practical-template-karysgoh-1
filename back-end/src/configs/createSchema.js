// create_db_postgres.js
require('dotenv').config();
const db = require('../services/db'); // Your PostgreSQL pool

const databaseName = process.env.DB_DATABASE; // Get database name from env

async function checkAndCreateDatabase() {
    const client = await db.getClient();
    try {
        const checkDbResult = await client.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [databaseName]
        );

        if (checkDbResult.rows.length === 0) {
            console.log(`Database "${databaseName}" does not exist. Creating...`);
            try {
                await client.query(`CREATE DATABASE ${databaseName}`);
                console.log(`Database "${databaseName}" created successfully.`);
            } catch (createError) {
                console.error("Error creating database:", createError);
            }
        } else {
            console.log(`Database "${databaseName}" already exists.`);
        }
    } catch (error) {
        console.error("Error checking database:", error);
    } finally {
        client.release();
        await db.end(); // Ensure the pool is closed
    }
}

checkAndCreateDatabase();