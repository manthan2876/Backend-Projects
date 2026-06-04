// db.js
import mysql from 'mysql2/promise';
import 'dotenv/config';

// Initialize a pool architecture to optimize thread reusability
export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Structural connection test verifying pipeline status on startup
export async function verifyDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Relational MySQL database engine link established successfully.');
        connection.release();
    } catch (err) {
        console.error('❌ Database connectivity initialization breakdown:', err.message);
        process.exit(1);
    }
}