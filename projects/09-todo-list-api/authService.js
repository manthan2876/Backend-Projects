import { MongoClient } from 'mongodb';
import { genSalt, hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const URL = process.env.MONGO_URI;
const DB_NAME = 'secure_todo_app';
const JWT_SECRET = process.env.JWT_SECRET;

let usersCollection = null;

/**
 * Initializes connection to the MongoDB users collection.
 */
async function initializeUserStorage(dbInstance) {
    if (!usersCollection) {
        const db = dbInstance || (await new MongoClient(URL).connect()).db(DB_NAME);
        usersCollection = db.collection('users');
        // Ensure username field is indexed and unique at the database tier
        await usersCollection.createIndex({ username: 1 }, { unique: true });
        console.log('MongoDB Users collection repository synchronized.');
    }
    return usersCollection;
}

/**
 * Validates uniqueness, hashes plain-text passwords, and registers a user profile.
 */
async function registerUser({ username, password }) {
    if (!username || !password) {
        throw new Error('Validation Error: Both username and password parameters are required.');
    }

    const sanitizedUsername = username.trim();
    
    // Check if username already exists
    const existingUser = await usersCollection.findOne({ username: sanitizedUsername });
    if (existingUser) {
        throw new Error(`Conflict Error: The username "${sanitizedUsername}" is already taken.`);
    }

    // Hash password securely using bcrypt
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const newUser = {
        id: Date.now(), // Unique numeric identifier used for relational mapping
        username: sanitizedUsername,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    await usersCollection.insertOne(newUser);
    
    // Omit sensitive data before returning user profile context records
    const { password: _, _id: __, ...userProfile } = newUser;
    return userProfile;
}

/**
 * Compares incoming credentials against hashes and returns a signed token.
 */
async function loginUser({ username, password }) {
    if (!username || !password) {
        throw new Error('Validation Error: Both username and password parameters are required.');
    }

    const user = await usersCollection.findOne({ username: username.trim() });
    if (!user) {
        throw new Error('Authentication Failed: Invalid username or password entry.');
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
        throw new Error('Authentication Failed: Invalid username or password entry.');
    }

    // Sign and return a JWT containing the user's custom numeric ID payload (valid for 24 hours)
    // Corrected to use the default 'jwt' namespace object wrapper directly
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Validates incoming HTTP bearer signature tokens.
 */
function verifyToken(token) {
    try {
        // Corrected to use the default 'jwt' namespace object wrapper directly
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

export {
    initializeUserStorage,
    registerUser,
    loginUser,
    verifyToken
};