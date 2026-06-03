import { createServer } from 'http';

// Global cache matrix mapping relative path URLs to their matching response packages
const proxyCache = new Map();

/**
 * Parses raw CLI process arguments into a structured operational config object mapping.
 * @returns {Object} Config container holding port, origin server url, and clear-cache instructions.
 */
function parseCliArguments() {
    const args = process.argv.slice(2);
    const config = { port: 3000, origin: null, clearCache: false };

    // Loop through args array to safely extract '--port', '--origin', and '--clear-cache' flags
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port' && i + 1 < args.length) {
            const parsedPort = parseInt(args[i + 1], 10);
            if (!isNaN(parsedPort)) {
                config.port = parsedPort;
            }
            i++; // Consume the value index
        } else if (args[i] === '--origin' && i + 1 < args.length) {
            // Trim any trailing slash from the origin URL to make path stitching clean
            config.origin = args[i + 1].replace(/\/$/, '');
            i++; // Consume the value index
        } else if (args[i] === '--clear-cache') {
            config.clearCache = true;
        }
    }
    return config;
}

/**
 * Intercepts client connections, handles caching evaluation algorithms, and proxies downstream calls.
 * @param {Object} req - Inbound readable server network request stream.
 * @param {Object} res - Outbound writable response stream network channel.
 * @param {Object} config - System setup values holding the origin server targets URL.
 */
async function handleProxyConnection(req, res, config) {
    const targetPath = req.url; // e.g., '/products' or '/users?id=2'
    const cacheKey = `${req.method}:${targetPath}`;

    // Helper to send uniform JSON error properties across standard error pipelines
    const sendErrorResponse = (statusCode, message) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message }));
    };

    // --- Caching Rules Intersection Matrix ---
    // 1. Enforce that only 'GET' requests are checked against the cache layer
    if (req.method === 'GET' && proxyCache.has(cacheKey)) {
        const cachedResponse = proxyCache.get(cacheKey);
        
        console.log(`[CACHE HIT] Serving response for: ${targetPath}`);
        
        // Return cached headers, status code, and body with 'X-Cache': 'HIT'
        res.writeHead(cachedResponse.statusCode, {
            ...cachedResponse.headers,
            'X-Cache': 'HIT'
        });
        res.end(cachedResponse.body);
        return;
    }

    // --- Cache MISS: Proxy Request Forwarding Downstream ---
    console.log(`[CACHE MISS] Forwarding request to origin: ${config.origin}${targetPath}`);
    
    try {
        const targetUrl = `${config.origin}${targetPath}`;
        
        // Fire an asynchronous global fetch call down to the destination target server
        const originResponse = await fetch(targetUrl, {
            method: req.method,
            headers: req.headers
        });

        // Read the response text string content completely
        const responseBody = await originResponse.text();

        // Convert origin response headers back into a standard dictionary object mapping
        const originHeaders = {};
        originResponse.headers.forEach((value, key) => {
            // Avoid forwarding chunked transfer flags that interfere with our manual delivery sizing
            if (key !== 'transfer-encoding') {
                originHeaders[key] = value;
            }
        });

        // Save successful GET interactions safely to the local proxy cache layer matrix
        if (req.method === 'GET' && originResponse.ok) {
            proxyCache.set(cacheKey, {
                statusCode: originResponse.status,
                headers: originHeaders,
                body: responseBody
            });
        }

        // Write the result payload back out to the client container with the custom 'MISS' header
        res.writeHead(originResponse.status, {
            ...originHeaders,
            'X-Cache': 'MISS'
        });
        res.end(responseBody);

    } catch (error) {
        console.error(`Upstream Fetch Failure: ${error.message}`);
        sendErrorResponse(502, `Bad Gateway: Could not resolve communication paths down to origin server.`);
    }
}

/**
 * Boots the application environment and sets up the server connection network listeners.
 */
function main() {
    const config = parseCliArguments();

    // Check if the user executed the clear cache script command routine line instruction
    if (config.clearCache) {
        console.log('Clearing local proxy database caching layers...');
        proxyCache.clear();
        console.log('Cache wiped successfully.');
        process.exit(0);
    }

    if (!config.origin) {
        console.error('Error: Mandatory initialization parameter flag "--origin <url>" is unassigned.');
        console.log('Usage: node index.js --port <number> --origin <target_server_url>');
        process.exit(1);
    }

    const server = createServer(async (req, res) => {
        try {
            await handleProxyConnection(req, res, config);
        } catch (err) {
            console.error('Proxy Server Pipeline Forwarding Error:', err.message);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad Gateway: Proxy server encountered forwarding communication disruptions.' }));
        }
    });

    server.listen(config.port, () => {
        console.log(`Caching Proxy Server running and listening on network port: ${config.port}`);
        console.log(`Proxying traffic directly down to origin target: ${config.origin}`);
    });
}

main();