import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { User } from './models.js';

const { sign, verify } = jwt;
const JWT_SECRET = process.env.JWT_SECRET;

export async function registerUser(username, password) {
    const existing = await User.findOne({ username });
    if (existing) throw new Error('Account creation rejected: Username is already claimed.');
    
    const user = await User.create({ username, password });
    const token = sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { id: user._id, username: user.username } };
}

export async function loginUser(username, password) {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
        throw new Error('Authentication rejected: Invalid username or password configurations.');
    }
    const token = sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { id: user._id, username: user.username } };
}

export function verifySession(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verify(token, JWT_SECRET);
        return { id: decoded.userId };
    } catch {
        return null;
    }
}