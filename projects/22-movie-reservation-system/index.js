import 'dotenv/config';
import { createServer } from 'http';
import { connectDatabase } from './db.js';
import { register, login, authorize } from './authService.js';
import { createMovie, createShowtime, getShowtimesByDate } from './movieService.js';
import { reserveSeats, cancelReservation } from './reservationService.js';

const PORT = process.env.PORT;

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Syntax Error: Invalid JSON input syntax body.')); }
        });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJson = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // --- Dynamic Parameter Regex Compilation Matcher Maps ---
    const reservationCancelMatch = pathname.match(/^\/reservations\/([a-fA-F0-9]{24})$/);

    // ==========================================
    // PUBLIC ACCESS GATEWAY PORTALS
    // ==========================================
    if (pathname === '/register' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const data = await register(body);
            return sendJson(201, data);
        } catch (err) { return sendJson(400, { error: err.message }); }
    }

    if (pathname === '/login' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const data = await login(body);
            return sendJson(200, data);
        } catch (err) { return sendJson(401, { error: err.message }); }
    }

    if (pathname === '/showtimes' && method === 'GET') {
        try {
            const targetDate = parsedUrl.searchParams.get('date');
            const data = await getShowtimesByDate(targetDate);
            return sendJson(200, data);
        } catch (err) { return sendJson(400, { error: err.message }); }
    }

    // ==========================================
    // PROTECTED CONTEXT IDENTITY VERIFIER
    // ==========================================
    const user = authorize(req.headers['authorization']);
    if (!user) {
        return sendJson(401, { error: 'Access Denied: Missing or corrupted credentials signature token.' });
    }

    // ==========================================
    // BACKOFFICE SYSTEM ADMINISTRATIVE ACTIONS
    // ==========================================
    if (user.role === 'admin') {
        if (pathname === '/movies' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const data = await createMovie(body);
                return sendJson(201, data);
            } catch (err) { return sendJson(400, { error: err.message }); }
        }

        if (pathname === '/showtimes' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const data = await createShowtime(body);
                return sendJson(201, data);
            } catch (err) { return sendJson(400, { error: err.message }); }
        }
    }

    // ==========================================
    // STANDARD CUSTOMER ACCOUNT ACTIONS
    // ==========================================
    if (user.role === 'customer') {
        if (pathname === '/reservations' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const data = await reserveSeats(user.id, body);
                return sendJson(201, data);
            } catch (err) { return sendJson(400, { error: err.message }); }
        }

        if (reservationCancelMatch && method === 'DELETE') {
            try {
                const reservationId = reservationCancelMatch[1];
                const result = await cancelReservation(user.id, reservationId);
                return sendJson(200, result);
            } catch (err) { return sendJson(400, { error: err.message }); }
        }
    }

    // Default route fallback match boundary block configurations parameters
    return sendJson(404, { error: 'Target framework endpoint route resource path can not be located.' });
}

async function main() {
    await connectDatabase();

    const server = createServer(async (req, res) => {
        try { await handleRequest(req, res); }
        catch (err) {
            console.error('System pipeline runtime execution anomaly caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal systemic connection error occurred.' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`Movie Reservation REST API engine actively tracking connections on port: ${PORT}`);
    });
}

main();