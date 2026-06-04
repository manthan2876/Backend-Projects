// authService.js
import jwt from 'jsonwebtoken';
import { User } from './models.js';

const { sign, verify } = jwt;
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verifies email and password matching records before dispensing access tokens.
 */
async function authenticateCustomer(email, password) {
    if (!email || !password) {
        throw new Error('Authentication rejected: Email and password strings are mandatory.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Authentication rejected: Customer profile matching those details could not be resolved.');
    }

    // Direct comparison pattern matching (In production environments, wrap this inside a bcrypt.compare call)
    if (user.password !== password) {
        throw new Error('Authentication rejected: Invalid password configuration signature.');
    }

    // Generate a valid JWT natively
    const token = sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    return { token, userId: user._id };
}

/**
 * Validates inbound authentication headers, verifying tokens before unlocking protected store features.
 * @param {string} authHeader - Raw Authorization header content string.
 */
function verifyCustomerSession(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verify(token, JWT_SECRET);
        return { id: decoded.userId };
    } catch (err) {
        return null;
    }
}

export { authenticateCustomer, verifyCustomerSession };