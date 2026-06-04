// db.js
import { connect } from 'mongoose';
import 'dotenv/config';

/**
 * Initializes persistent database connection lines out to local MongoDB targets.
 */
async function connectDatabase() {
    const MONGO_URI = process.env.MONGO_URI;
    
    try {
        await connect(MONGO_URI);
        console.log('✅ E-commerce database core link established.');
    } catch (err) {
        console.error('❌ Database instantiation breakdown event caught:', err.message);
        process.exit(1);
    }
}

export { connectDatabase };