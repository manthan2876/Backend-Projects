// index.js
import { createServer } from 'http';
import { verifyDatabaseConnection } from './db.js';
import { getWorkoutStats, getAllWorkouts, createWorkoutSession, deleteWorkoutSession } from './workoutService.js';

const PORT = process.env.PORT || 3000;

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); } 
            catch { reject(new Error('Syntax Error: Invalid structural JSON format payload syntax.')); }
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

    // 1. GET /workouts/stats (Analytics Metrics summary)
    if (pathname === '/workouts/stats' && method === 'GET') {
        try {
            const stats = await getWorkoutStats();
            return sendJsonResponse(200, { message: "Cumulative metrics calculated successfully.", stats });
        } catch (err) {
            return sendJsonResponse(500, { error: err.message });
        }
    }

    // 2. GET /workouts (View structural index log tracking)
    if (pathname === '/workouts' && method === 'GET') {
        try {
            const rangeFilter = parsedUrl.searchParams.get('range');
            if (rangeFilter && rangeFilter !== 'week' && rangeFilter !== 'month') {
                return sendJsonResponse(400, { error: "Invalid range parameter selection. Use 'week' or 'month'." });
            }
            const workouts = await getAllWorkouts(rangeFilter);
            return sendJsonResponse(200, { message: "Workout records list feed resolved successfully.", count: workouts.length, workouts });
        } catch (err) {
            return sendJsonResponse(500, { error: err.message });
        }
    }

    // 3. POST /workouts (Create record data nodes matching criteria variables)
    if (pathname === '/workouts' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const { name, durationMinutes, exercises } = body;

            if (!name || typeof name !== 'string') throw new Error('Validation Failed: Field "name" is required.');
            if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes <= 0) throw new Error('Validation Failed: Field "durationMinutes" must be positive.');
            if (!Array.isArray(exercises) || exercises.length === 0) throw new Error('Validation Failed: "exercises" array blocks missing.');

            exercises.forEach((ex, idx) => {
                if (!ex.exerciseName || typeof ex.sets !== 'number' || ex.sets <= 0 || typeof ex.reps !== 'number' || ex.reps <= 0) {
                    throw new Error(`Validation Failed: Incorrect parameter keys under index item context ${idx}.`);
                }
            });

            const MET_CALORIE_COEFFICIENT = 8.5;
            const calculatedCalories = Math.round(durationMinutes * MET_CALORIE_COEFFICIENT);

            const insertedWorkoutRecord = await createWorkoutSession({
                name,
                durationMinutes,
                totalCaloriesBurned: calculatedCalories,
                exercises
            });

            return sendJsonResponse(201, { message: "Workout session recorded inside database successfully.", workout: insertedWorkoutRecord });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // 4. DELETE /workouts/:id (Relational target deletion tracing)
    const idMatch = pathname.match(/^\/workouts\/(\d+)$/);
    if (idMatch && method === 'DELETE') {
        try {
            const workoutId = parseInt(idMatch[1], 10);
            const wasDeleted = await deleteWorkoutSession(workoutId);

            if (!wasDeleted) {
                return sendJsonResponse(404, { error: `Target tracking item reference ID ${workoutId} could not be resolved.` });
            }
            return sendJsonResponse(200, { message: `Workout entry trace tracking identity ID ${workoutId} flushed down cleanly.` });
        } catch (err) {
            return sendJsonResponse(500, { error: err.message });
        }
    }

    return sendJsonResponse(404, { error: 'Target API endpoint route path could not be resolved.' });
}

async function main() {
    // Audit relational driver engine link up before spinning up network listener wrappers
    await verifyDatabaseConnection();

    const server = createServer(async (req, res) => {
        try { await handleRequest(req, res); } 
        catch (err) {
            console.error('Systemic Error Catching Layer Triggered:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal systemic tracker platform crash handler event logs parsed.' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`🚀 Workout Tracker API actively executing SQL queries on connection port: ${PORT}`);
    });
}

main();