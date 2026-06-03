import { createServer } from 'http';
import { MongoClient } from 'mongodb';
import { initializeUserStorage, registerUser, loginUser, verifyToken } from './authService.js';
import { initializeTodoStorage, readUserTodos, createUserTodo, updateUserTodo, deleteUserTodo } from './todoService.js';

const PORT = 3000;
const MONGO_URL = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'secure_todo_app';

/**
 * Aggregates chunk buffers asynchronously from standard network request pipelines.
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(new Error('Syntax Error: Malformed JSON body content payload.'));
            }
        });
    });
}

/**
 * Validates request authorization headers, returning user credentials on validation success.
 */
function authenticateRequest(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return verifyToken(token);
}

/**
 * Evaluates request criteria and handles routing destinations safely.
 */
async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJsonResponse = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    const idMatch = pathname.match(/^\/todos\/(\d+)$/);

    // --- Authentication Access Points (Public) ---
    if (pathname === '/register' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const user = await registerUser(body);
            return sendJsonResponse(201, { message: "User account created successfully.", user });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    if (pathname === '/login' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const token = await loginUser(body);
            return sendJsonResponse(200, { token });
        } catch (err) {
            return sendJsonResponse(401, { error: err.message });
        }
    }

    // --- Protected Workspace Resource Interceptors (Private) ---
    if (pathname.startsWith('/todos')) {
        const userPayload = authenticateRequest(req);
        if (!userPayload) {
            return sendJsonResponse(401, { error: "Access Denied: Missing or expired authentication token signatures." });
        }

        // 1. GET /todos - Fetch only tasks belonging to authenticated tenant
        if (pathname === '/todos' && method === 'GET') {
            const todos = await readUserTodos(userPayload.id);
            return sendJsonResponse(200, todos);
        }

        // 2. POST /todos - Append task under active tenant profile identifier
        if (pathname === '/todos' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const newTodo = await createUserTodo(userPayload.id, body);
                return sendJsonResponse(201, newTodo);
            } catch (err) {
                return sendJsonResponse(400, { error: err.message });
            }
        }

        // 3. PUT /todos/:id - Modify tenant task securely
        if (idMatch && method === 'PUT') {
            const todoId = parseInt(idMatch[1], 10);
            try {
                const body = await parseRequestBody(req);
                const result = await updateUserTodo(todoId, userPayload.id, body);
                if (result.status !== 200) {
                    return sendJsonResponse(result.status, { error: result.message });
                }
                return sendJsonResponse(200, result.data);
            } catch (err) {
                return sendJsonResponse(400, { error: err.message });
            }
        }

        // 4. DELETE /todos/:id - Wipe tenant task securely
        if (idMatch && method === 'DELETE') {
            const todoId = parseInt(idMatch[1], 10);
            const result = await deleteUserTodo(todoId, userPayload.id);
            if (result.status !== 200) {
                return sendJsonResponse(result.status, { error: result.message });
            }
            return sendJsonResponse(200, { message: result.message });
        }
    }

    return sendJsonResponse(404, { error: 'Target API endpoint route path could not be resolved.' });
}

/**
 * Initializes network proxy listener nodes and handles shared Mongo client connectivity.
 */
async function main() {
    try {
        // Instantiate unified MongoClient connection link
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        const db = client.db(DB_NAME);

        // Share the shared connection handle across independent service abstractions
        await initializeUserStorage(db);
        await initializeTodoStorage(db);

        const server = createServer(async (req, res) => {
            try {
                await handleRequest(req, res);
            } catch (err) {
                console.error('Core API Server pipeline error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal systemic platform error occurred.' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`Secure Todo List API actively listening on network port: ${PORT}`);
        });
    } catch (criticalErr) {
        console.error('System failed to launch safely due to database initialization anomalies:', criticalErr.message);
        process.exit(1);
    }
}

main();