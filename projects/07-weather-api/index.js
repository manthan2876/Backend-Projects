import { createServer } from 'http';
import 'dotenv/config';

// Configurable operational settings and cache duration thresholds
const PORT = 3000;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 Hours duration parameter tracking matrix

// Local in-memory caching storage map container
const weatherCache = new Map();

/**
 * Initiates an asynchronous network fetch request down to the external third-party API service.
 * @param {string} city - Target geographic location search term.
 * @returns {Promise<Object>} Cleaned weather metric analytics data.
 */
async function fetchThirdPartyWeatherData(city) {
    // Ensure the API key exists before firing off requests
    if (!process.env.WEATHER_API_KEY) {
        throw new Error("Missing WEATHER_API_KEY inside environment variables setup configuration.");
    }
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}`
    );
    
    if (!response.ok) {
        throw new Error(`Third-party API request failed with status: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Intercepts incoming HTTP requests, coordinates cache validation checks, and returns responses.
 * @param {Object} req - Native incoming server connection request stream.
 * @param {Object} res - Native write stream response channel execution resource.
 */
async function handleWeatherRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // Helper closure utility to return structured JSON configurations uniformly across networks
    const sendJsonResponse = (statusCode, headers, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json', ...headers });
        res.end(JSON.stringify(payload));
    };

    // Ensure the routing path targets '/weather' specifically using a GET method
    if (pathname === '/weather' && req.method === 'GET') {
        const city = parsedUrl.searchParams.get('city');
            // Parameter existence check validation
        if (!city || city.trim() === '') {
            return sendJsonResponse(400, {}, { error: "Required parameter 'city' argument string values missing." });
        }

        const normalizedCity = city.trim().toLowerCase();

        // --- Cache Processing Logic Flow ---
        if (weatherCache.has(normalizedCity)) {
            const cachedEntry = weatherCache.get(normalizedCity);
            
            // 2. Evaluate if Date.now() < cachedEntry.expiresAt.
            if (Date.now() < cachedEntry.expiresAt) {
                // VALID HIT: Return data instantly with hit tracker headers
                return sendJsonResponse(200, { 'X-Cache': 'HIT' }, cachedEntry.data);
            } else {
                // EXPIRED / MISS: Wipe target stale key out of storage map
                weatherCache.delete(normalizedCity);
            }
        }

        // On a cache MISS, invoke third-party endpoints
        try {
            const weatherData = await fetchThirdPartyWeatherData(normalizedCity);
            
            // Cache the successful response metadata payload with its expiration epoch timestamp
            weatherCache.set(normalizedCity, {
                data: weatherData,
                expiresAt: Date.now() + CACHE_TTL_MS
            });
            
            // Stream result back to client with header: { 'X-Cache': 'MISS' }
            return sendJsonResponse(200, { 'X-Cache': 'MISS' }, weatherData);
        } catch (err) {
            console.error('Error processing network operations for third-party API:', err.message);
            return sendJsonResponse(502, {}, { error: 'Failed to retrieve data from external weather service.' });
        }
    }

    // Capture path mismatches that skip the registered server routing blocks
    return sendJsonResponse(404, {}, { error: "Target resource API path route maps could not be resolved." });
}

/**
 * Initializes the application native HTTP server listener bindings.
 */
function main() {
    const server = createServer(async (req, res) => {
        try {
            await handleWeatherRequest(req, res);
        } catch (err) {
            console.error('System request server execution anomaly caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server proxy runtime routing failure.' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`Weather API Backend Service actively listening on network port: ${PORT}`);
    });
}

main();