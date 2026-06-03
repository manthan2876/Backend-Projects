import { createServer } from 'http';
import { initializeStorage, readPosts, writePosts, updatePostById, deletePostById } from './postService.js';

const PORT = 3000;

/**
 * Asynchronously processes incoming request buffer chunks, aggregating streams into structural text.
 * @param {Object} req - Native incoming network stream resource hook.
 * @returns {Promise<Object>} Formatted request payload dictionary mappings.
 */
function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error('Syntax Error: Invalid structural JSON format payload syntax.'));
            }
        });
    });
}

/**
 * Inspects structural URL patterns, evaluates path criteria, and routes requests to the correct handler.
 * @param {Object} req - Server readable connection request stream parameters.
 * @param {Object} res - Server write response connection stream indicators.
 */
async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Helper to send clean JSON structures back across network responses uniform channels
    const sendJsonResponse = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // Evaluate active path parameters and regex identifier groupings mapping rules
    const idMatch = pathname.match(/^\/posts\/(\d+)$/);

    // --- REST Endpoint Routing Matrix Tree ---
    
    // 1. GET /posts (Supports optional ?category=X or ?term=Y queries)
    if (pathname === '/posts' && method === 'GET') {
        const category = parsedUrl.searchParams.get('category');
        const term = parsedUrl.searchParams.get('term');
        
        const mongoQuery = {};
        
        if (category) {
            mongoQuery.category = category;
        }
        if (term) {
            // Case-insensitive substring search using MongoDB regex option pattern blocks
            mongoQuery.$or = [
                { title: { $regex: term, $options: 'i' } },
                { content: { $regex: term, $options: 'i' } }
            ];
        }

        const results = await readPosts(mongoQuery);
        return sendJsonResponse(200, results);
    }

    // 2. POST /posts (Creates a new blog post)
    else if (pathname === '/posts' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const { title, content, category } = body;

            // Run schema constraints rules validation tests
            if (!title || !content) {
                return sendJsonResponse(400, { error: 'Validation Error: Title and Content are required fields.' });
            }

            // Append auto-increment epoch ID and ISO timestamp properties schema
            const newPost = {
                id: Date.now(), 
                title: title.trim(),
                content: content.trim(),
                category: category ? category.trim() : 'General',
                createdAt: new Date().toISOString()
            };

            await writePosts(newPost);
            return sendJsonResponse(201, newPost);
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // 3. GET /posts/:id (Retrieves a single blog post)
    else if (idMatch && method === 'GET') {
        const postId = parseInt(idMatch[1], 10);
        const posts = await readPosts({ id: postId });
        
        if (posts.length === 0) {
            return sendJsonResponse(404, { error: `Resource Error: Post matching ID ${postId} cannot be found.` });
        }
        
        return sendJsonResponse(200, posts[0]);
    }

    // 4. PUT /posts/:id (Updates an existing blog post)
    else if (idMatch && method === 'PUT') {
        const postId = parseInt(idMatch[1], 10);
        try {
            const body = await parseRequestBody(req);
            
            if (Object.keys(body).length === 0) {
                return sendJsonResponse(400, { error: 'Payload Error: No updatable fields provided.' });
            }

            // Object update normalization parameters map
            const updateFields = {};
            if (body.title) updateFields.title = body.title.trim();
            if (body.content) updateFields.content = body.content.trim();
            if (body.category) updateFields.category = body.category.trim();
            updateFields.updatedAt = new Date().toISOString();

            const isUpdated = await updatePostById(postId, updateFields);
            
            if (!isUpdated) {
                return sendJsonResponse(404, { error: `Resource Error: Post matching ID ${postId} cannot be found.` });
            }

            return sendJsonResponse(200, { success: true, message: `Post ${postId} has been modified successfully.` });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // 5. DELETE /posts/:id (Removes a blog post)
    else if (idMatch && method === 'DELETE') {
        const postId = parseInt(idMatch[1], 10);
        const isDeleted = await deletePostById(postId);
        
        if (!isDeleted) {
            return sendJsonResponse(404, { error: `Resource Error: Post matching ID ${postId} cannot be found.` });
        }
        
        return sendJsonResponse(200, { success: true, message: `Post ${postId} removed from database repository.` });
    }

    // 6. Catch-all fallback boundary interceptor rule path
    else {
        return sendJsonResponse(404, { error: 'Target API endpoint route path could not be resolved.' });
    }
}

/**
 * Initializes native HTTP server network listeners.
 */
async function main() {
    try {
        // Await the asynchronous database connection before bootstrapping the server infrastructure
        await initializeStorage();

        const server = createServer(async (req, res) => {
            try {
                await handleRequest(req, res);
            } catch (err) {
                console.error('Blogging API Server Pipeline routing anomaly caught:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal systemic platform error occurred.' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`Blogging Platform API actively listening on network port: ${PORT}`);
        });
    } catch (err) {
        console.error('Critical System Boot Exception Caught:', err.message);
        process.exit(1);
    }
}

main();