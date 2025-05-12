const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1); // Commented out for debugging
});

module.exports = {
    query: function (text, params, callback) { // Changed to a traditional function
        console.log('services/db.js - query function called');
        console.log('services/db.js - query text:', text);
        console.log('services/db.js - query params:', params);

        const startTime = Date.now();
        return pool.query(text, params, (err, result) => {
            const duration = Date.now() - startTime;
            console.log('services/db.js - pool.query callback executed');
            console.log('services/db.js - pool.query error:', err);
            console.log('services/db.js - pool.query result:', result);
            console.log('services/db.js - query duration:', duration, 'ms');

            if (err) {
                console.error('services/db.js - Error in pool.query:', err);
            }
            callback(err, result);
        });
    },
    getClient: () => pool.connect(),
    end: () => pool.end()
};