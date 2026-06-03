import { MongoClient } from 'mongodb';
import 'dotenv/config';

// Local MongoDB Connection Configuration
const URL = process.env.MONGO_URI;
const DB_NAME = 'expense_tracker';
const COLLECTION_NAME = 'expenses';

let dbClient = null;
let expensesCollection = null;

/**
 * Initializes the database connection channel parameters.
 */
async function initializeStorage() {
    try {
        if (!dbClient) {
            dbClient = new MongoClient(URL);
            await dbClient.connect();
            const db = dbClient.db(DB_NAME);
            expensesCollection = db.collection(COLLECTION_NAME);
            
            // Speed up calculations and lookups using a unique numerical identifier index
            await expensesCollection.createIndex({ id: 1 }, { unique: true });
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
    if (!expensesCollection) {
        throw new Error('Database connection has not been initialized. call initializeStorage() first.');
    }
}

/**
 * Retrieves datasets from MongoDB matching explicit search rules.
 * @param {Object} query - MongoDB query filtering document parameters.
 * @returns {Promise<Array>} List of expense items.
 */
async function readExpenses(query = {}) {
    checkConnection();
    // Exclude the internal MongoDB _id property to keep cleanly structured numeric tracking schemas
    return await expensesCollection.find(query).project({ _id: 0 }).toArray();
}

/**
 * Inserts a new validated expense document down into MongoDB.
 * @param {Object} expenseData - Formatted expense tracking properties mapping definitions.
 */
async function writeExpenses(expenseData) {
    checkConnection();
    await expensesCollection.insertOne(expenseData);
}

/**
 * Drops an item out of the active collection tracking repositories.
 * @param {number} expenseId - Unique target tracking primary reference key identifier.
 * @returns {Promise<boolean>} True if matching element was dropped, otherwise false.
 */
async function deleteExpenseById(expenseId) {
    checkConnection();
    const result = await expensesCollection.deleteOne({ id: expenseId });
    return result.deletedCount > 0;
}

export {
    initializeStorage,
    readExpenses,
    writeExpenses,
    deleteExpenseById
};