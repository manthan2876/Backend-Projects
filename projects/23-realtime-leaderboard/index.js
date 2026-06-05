import { createServer } from 'http';
import { connectRedis, submitScore, getTopLeaderboard, getPlayerRank, removePlayerScore } from './leaderboardService.js';

const PORT = process.env.PORT;

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Syntax Error: Invalid JSON input template payload body.')); }
        });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJsonResponse = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // --- Dynamic Route Expressions Mapping Wildcards Rules ---
    const rankLookupMatch = pathname.match(/^\/leaderboard\/rank\/([^/]+)$/);
    const scoreDeletionMatch = pathname.match(/^\/scores\/([^/]+)$/);

    // Endpoint 1: Submit / Update Score Metrics
    if (pathname === '/scores' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const data = await submitScore(body.username, body.score);
            return sendJsonResponse(200, { message: 'Score telemetry logged successfully.', data });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // Endpoint 2: Read Top 10 High-Scorers List
    if (pathname === '/leaderboard' && method === 'GET') {
        try {
            const chartList = await getTopLeaderboard();
            return sendJsonResponse(200, { leaderboard: chartList });
        } catch (err) {
            return sendJsonResponse(500, { error: err.message });
        }
    }

    // Endpoint 3: Read Specific Player Rank and Score Metrics
    if (rankLookupMatch && method === 'GET') {
        try {
            const targetUser = decodeURIComponent(rankLookupMatch[1]);
            const analytics = await getPlayerRank(targetUser);
            return sendJsonResponse(200, analytics);
        } catch (err) {
            return sendJsonResponse(404, { error: err.message });
        }
    }

    // Endpoint 4: Exterminate Player Tracking Signature Node
    if (scoreDeletionMatch && method === 'DELETE') {
        try {
            const targetUser = decodeURIComponent(scoreDeletionMatch[1]);
            const operationalOutcome = await removePlayerScore(targetUser);
            return sendJsonResponse(200, operationalOutcome);
        } catch (err) {
            return sendJsonResponse(404, { error: err.message });
        }
    }

    // Path route missing fallback boundary check
    return sendJsonResponse(404, { error: 'Target API routing parameter path cannot be resolved.' });
}

async function main() {
    // Fire up memory persistence connections before launching server routing engines
    await connectRedis();

    const server = createServer(async (req, res) => {
        try {
            await handleRequest(req, res);
        } catch (err) {
            console.error('System pipeline parsing error caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server proxy runtime routing failure.' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`Real-time Redis Leaderboard API engine actively tracking network connections on port: ${PORT}`);
    });
}

main();