import { createServer } from 'http';
import { initializeStorage, readUrls, writeUrls, incrementClickCount } from './urlService.js';

const PORT = 3000;

/**
 * Asynchronously processes incoming request streams, aggregating chunks into structural text.
 * @param {Object} req - Native incoming network stream resource hook.
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
 * Generates a randomized, alphanumeric unique code string matching explicit length bounds.
 * @param {number} length - Desired character count threshold.
 * @returns {string} Unique token code.
 */
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        code += chars[randomIndex];
    }
    return code;
}

/**
 * Inspects request paths parameters, evaluating queries against dynamic API routing rules.
 */
async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJsonResponse = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // --- Route 1: Post Long Destination to Shorten ---
    if (pathname === '/shorten' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const originalUrl = body.url ? body.url.trim() : '';

            if (!originalUrl) {
                return sendJsonResponse(400, { error: 'Validation Error: Required payload property field "url" is missing.' });
            }

            // Simple URL validation parsing test loop
            try {
                new URL(originalUrl);
            } catch (_) {
                return sendJsonResponse(400, { error: 'Validation Error: Invalid web address formatting. Ensure it contains a valid protocol (e.g., http:// or https://).' });
            }

            // Generate a unique 6-character short code and ensure no duplicate code collisions exist
            let shortCode = generateShortCode(6);
            let checkCollision = await readUrls({ shortCode });
            while (checkCollision.length > 0) {
                shortCode = generateShortCode(6);
                checkCollision = await readUrls({ shortCode });
            }

            // Assemble object schema mapping fields
            const newUrlEntry = {
                id: Date.now(),
                shortCode: shortCode,
                originalUrl: originalUrl,
                clicks: 0,
                createdAt: new Date().toISOString()
            };

            await writeUrls(newUrlEntry);

            // Construct the final shortened link to return back in the metrics payload
            const shortLink = `http://${req.headers.host}/${shortCode}`;
            return sendJsonResponse(201, {
                message: 'URL shortened successfully.',
                shortLink: shortLink,
                ...newUrlEntry
            });

        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // --- Route 2: View Analytics for Specific Short Code ---
    const analyticsMatch = pathname.match(/^\/analytics\/([a-zA-Z0-9]+)$/);
    if (analyticsMatch && method === 'GET') {
        const shortCode = analyticsMatch[1];
        const urls = await readUrls({ shortCode });

        // Find link object matching shortCode. Return 404 if missing.
        if (urls.length === 0) {
            return sendJsonResponse(404, { error: `Resource Error: Short code parameter "${shortCode}" does not exist in our systems.` });
        }

        // Return 200 OK with the object analytics details
        return sendJsonResponse(200, urls[0]);
    }

    // --- Route 3: Wildcard Root Redirect Path Router ---
    const redirectMatch = pathname.match(/^\/([a-zA-Z0-9]+)$/);
    if (redirectMatch && method === 'GET') {
        const shortCode = redirectMatch[1];
        const urls = await readUrls({ shortCode });

        // Locate link object matching shortCode. Return 404 if missing.
        if (urls.length === 0) {
            return sendJsonResponse(404, { error: `Resource Error: Target link mapped to path matching code "${shortCode}" cannot be found.` });
        }

        const targetRecord = urls[0];

        // Increment the link object's clicks count parameter (+1) atomically inside database collections
        await incrementClickCount(shortCode);

        // Issue an explicit 302 redirect back using the original long URL reference
        res.writeHead(302, { 'Location': targetRecord.originalUrl });
        return res.end();
    }

    // Catch-all route boundary
    return sendJsonResponse(404, { error: 'Target API endpoint route path could not be resolved.' });
}

/**
 * Initializes native HTTP server network listeners.
 */
async function main() {
    try {
        // Boot up and await the shared database client connections securely before spawning server blocks
        await initializeStorage();

        const server = createServer(async (req, res) => {
            try {
                await handleRequest(req, res);
            } catch (err) {
                console.error('URL Shortener Pipeline routing anomaly caught:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal systemic platform error occurred.' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`URL Shortener REST API actively listening on network port: ${PORT}`);
        });
    } catch (bootError) {
        console.error('System failed to launch safely due to database initialization errors:', bootError.message);
        process.exit(1);
    }
}

main();