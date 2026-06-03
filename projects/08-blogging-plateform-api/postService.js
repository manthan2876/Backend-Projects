import { MongoClient } from 'mongodb';

// Local MongoDB Connection URI (Maps directly to MongoDB Compass default local port)
const URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'blogging_platform';
const COLLECTION_NAME = 'posts';

let dbClient = null;
let postsCollection = null;

/**
 * Initializes the database connection and collection instance variables.
 */
async function initializeStorage() {
    try {
        if (!dbClient) {
            dbClient = new MongoClient(URL);
            await dbClient.connect();
            const db = dbClient.db(DB_NAME);
            postsCollection = db.collection(COLLECTION_NAME);
            console.log('Successfully connected to local MongoDB instance via Compass configuration.');
        }
    } catch (error) {
        console.error('Failed to establish connection to local MongoDB database:', error.message);
        throw error;
    }
}

/**
 * Helper utility to verify storage has been initialized prior to execution queries.
 */
function checkConnection() {
    if (!postsCollection) {
        throw new Error('Database connection has not been initialized yet. Call initializeStorage() first.');
    }
}

/**
 * Retrieves full datasets collections out of MongoDB matching target search parameters.
 * @param {Object} query - Filtering conditions passed from routing controllers.
 * @returns {Promise<Array>} Collection containing structural blog post elements.
 */
async function readPosts(query = {}) {
    checkConnection();
    // Exclude the native MongoDB _id field to match your clean numeric API schemas if needed
    return await postsCollection.find(query).project({ _id: 0 }).toArray();
}

/**
 * Appends a new article structure directly down to your database collection.
 * @param {Object} postData - Object structure matching schema tracking properties.
 */
async function writePosts(postData) {
    checkConnection();
    await postsCollection.insertOne(postData);
}

/**
 * Updates a specific record in MongoDB by its unique numeric ID.
 * @param {number} postId - Identifier matching the target record.
 * @param {Object} updateData - Key-value structural properties to replace.
 * @returns {Promise<boolean>} True if matching element was updated, otherwise false.
 */
async function updatePostById(postId, updateData) {
    checkConnection();
    const result = await postsCollection.updateOne(
        { id: postId },
        { $set: updateData }
    );
    return result.matchedCount > 0;
}

/**
 * Removes a specific record from MongoDB by its unique numeric ID.
 * @param {number} postId - Identifier matching the target record.
 * @returns {Promise<boolean>} True if matching element was deleted, otherwise false.
 */
async function deletePostById(postId) {
    checkConnection();
    const result = await postsCollection.deleteOne({ id: postId });
    return result.deletedCount > 0;
}

export {
    initializeStorage,
    readPosts,
    writePosts,
    updatePostById,
    deletePostById
};