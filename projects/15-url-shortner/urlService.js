import { MongoClient } from 'mongodb';

// Local MongoDB Connection Configuration (Direct mapping to MongoDB Compass defaults)
const URL = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'url_shortener_db';
const COLLECTION_NAME = 'urls';

let dbClient = null;
let urlsCollection = null;

/**
 * Initializes local storage array database borders cleanly.
 */
async function initializeStorage() {
    try {
        if (!dbClient) {
            dbClient = new MongoClient(URL);
            await dbClient.connect();
            const db = dbClient.db(DB_NAME);
            urlsCollection = db.collection(COLLECTION_NAME);
            
            // Build unique tracking indexes for lightning-fast redirections and collision safety
            await urlsCollection.createIndex({ shortCode: 1 }, { unique: true });
            console.log('Successfully connected to MongoDB via Compass instance configuration.');
        }
    } catch (error) {
        console.error('Critical Database connection error encountered:', error.message);
        throw error;
    }
}

/**
 * Structural helper to guarantee the database connection is initialized.
 */
function checkConnection() {
    if (!urlsCollection) {
        throw new Error('Database connection has not been initialized. Call initializeStorage() first.');
    }
}

/**
 * Retrieves records matching explicit search objects.
 * @param {Object} query - MongoDB filtering document parameters.
 * @returns {Promise<Array>} List of short URL entries matching criteria.
 */
async function readUrls(query = {}) {
    checkConnection();
    // Exclude the internal MongoDB _id property to keep cleanly structured clean APIs
    return await urlsCollection.find(query).project({ _id: 0 }).toArray();
}

/**
 * Inserts a newly generated shortened link document record straight to collections.
 * @param {Object} urlData - Fully assembled document scheme mappings.
 */
async function writeUrls(urlData) {
    checkConnection();
    await urlsCollection.insertOne(urlData);
}

/**
 * Increments click tracking metrics atomically by a value of +1 inside MongoDB records.
 * @param {string} shortCode - Target string key matching unique short identifier.
 */
async function incrementClickCount(shortCode) {
    checkConnection();
    await urlsCollection.updateOne(
        { shortCode: shortCode },
        { $inc: { clicks: 1 } }
    );
}

export {
    initializeStorage,
    readUrls,
    writeUrls,
    incrementClickCount
};