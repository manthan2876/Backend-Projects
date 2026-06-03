import { createServer } from 'http';
import { initializeStorage, readExpenses, writeExpenses, deleteExpenseById } from './expenseService.js';

const PORT = 3000;

/**
 * Asynchronously processes incoming request streams, aggregating chunks into text.
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
 * Inspects URL patterns and maps HTTP methods to core data utilities.
 */
async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    const sendJsonResponse = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // --- Dynamic Route Ordering Logic Tree ---

    // 1. GET /expenses/summary (Accumulates sums, optionally filtering by month '01'-'12')
    if (pathname === '/expenses/summary' && method === 'GET') {
        const targetMonth = parsedUrl.searchParams.get('month'); // Expected: '01' through '12'
        const mongoQuery = {};

        // If targetMonth is active, use a case-insensitive regex to catch months inside ISO strings (YYYY-MM-DD)
        if (targetMonth) {
            if (!/^(0[1-9]|1[0-2])$/.test(targetMonth)) {
                return sendJsonResponse(400, { error: 'Validation Error: Month argument query parameter must be a two-digit string format between 01 and 12.' });
            }
            mongoQuery.date = { $regex: `^\\d{4}-${targetMonth}-\\d{2}` };
        }

        const expenses = await readExpenses(mongoQuery);

        // Accumulate floating-point parameters safely using standard array reduce blocks
        const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

        return sendJsonResponse(200, {
            filterApplied: targetMonth ? `Month: ${targetMonth}` : 'All structural entries',
            recordsCount: expenses.length,
            totalSum: parseFloat(totalAmount.toFixed(2)) // Standardize financial trailing float positions
        });
    }

    // 2. GET /expenses (Fetches list records, supports optional ?category=X filtering)
    if (pathname === '/expenses' && method === 'GET') {
        const categoryFilter = parsedUrl.searchParams.get('category');
        const mongoQuery = {};

        if (categoryFilter) {
            // Case-insensitive regex match tracking variables mapping values uniformly
            mongoQuery.category = { $regex: `^${categoryFilter.trim()}$`, $options: 'i' };
        }

        const expenses = await readExpenses(mongoQuery);
        return sendJsonResponse(200, expenses);
    }

    // 3. POST /expenses (Appends a structural financial tracking item)
    if (pathname === '/expenses' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const { title, amount, category } = body;

            // Strict validation checks
            if (!title || amount === undefined || !category) {
                return sendJsonResponse(400, { error: 'Validation Error: Missing required fields (title, amount, category).' });
            }

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return sendJsonResponse(400, { error: 'Validation Error: Field amount parameter must resolve to a valid positive number greater than zero.' });
            }

            const newExpense = {
                id: Date.now(), // Unique numerical primary lookup ID
                title: title.trim(),
                amount: parseFloat(parsedAmount.toFixed(2)),
                category: category.trim(),
                date: new Date().toISOString().split('T')[0] // Formats cleanly to YYYY-MM-DD
            };

            await writeExpenses(newExpense);
            return sendJsonResponse(201, newExpense);
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // Wildcard numerical matching expression evaluation blocks
    const idMatch = pathname.match(/^\/expenses\/(\d+)$/);

    // 4. DELETE /expenses/:id (Pures records out of database systems safely)
    if (idMatch && method === 'DELETE') {
        const expenseId = parseInt(idMatch[1], 10);
        const isDeleted = await deleteExpenseById(expenseId);

        if (!isDeleted) {
            return sendJsonResponse(404, { error: `Resource Error: Expense log matching ID ${expenseId} cannot be found.` });
        }

        return sendJsonResponse(200, { success: true, message: `Expense record ${expenseId} completely purged from collections.` });
    }

    // Catch-all route boundary
    return sendJsonResponse(404, { error: 'Target API endpoint route path could not be resolved.' });
}

/**
 * Initializes the main HTTP server listeners.
 */
async function main() {
    try {
        // Boost and await our database client links securely before piping standard web traffic hooks
        await initializeStorage();

        const server = createServer(async (req, res) => {
            try {
                await handleRequest(req, res);
            } catch (err) {
                console.error('API Server Pipeline routing anomaly caught:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal systemic platform error occurred.' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`Expense Tracker API actively listening on network port: ${PORT}`);
        });
    } catch (bootError) {
        console.error('System bootstrap process terminated abnormally:', bootError.message);
        process.exit(1);
    }
}

main();