import 'dotenv/config';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './db.js';

const { sign, verify } = jwt;
const JWT_SECRET = process.env.JWT_SECRET;

async function register({ name, email, password, role }) {
    if (!email || !password || !name) throw new Error('Missing registration parameters.');
    
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email address is already registered.');

    const passwordHash = await hash(password, 10);
    const user = await User.create({
        name,
        email,
        password: passwordHash,
        role: role === 'admin' ? 'admin' : 'customer'
    });

    const token = sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
}

async function login({ email, password }) {
    if (!email || !password) throw new Error('Missing login credentials.');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid email or password credentials.');

    const isMatch = await compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password credentials.');

    const token = sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return { token };
}

function authorize(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    try {
        return verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export { register, login, authorize };