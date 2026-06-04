// index.js
import { createServer } from 'http';
import { connectDatabase } from './db.js';
import { authenticateCustomer, verifyCustomerSession } from './authService.js';
import { getCatalog, appendToCart, removeFromCart, checkoutCart } from './shopService.js';
import { User, Product } from './models.js';

const PORT = process.env.PORT;

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { reject(new Error('Syntax Error: Invalid JSON body layout format.')); }
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

    // --- Public Authentication & Account Management ---

    // 1. User Registration Route
    if (pathname === '/register' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const newUser = await User.create({
                email: body.email,
                password: body.password,
                cart: []
            });
            return sendJsonResponse(201, { message: "User registered successfully", userId: newUser._id });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // 2. User Authentication Route (Dispenses JWT natively!)
    if (pathname === '/login' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const authDetails = await authenticateCustomer(body.email, body.password);
            return sendJsonResponse(200, { message: "Login authentication successful", ...authDetails });
        } catch (err) {
            return sendJsonResponse(401, { error: err.message });
        }
    }

    // 3. View & Search Store Catalog
    if (pathname === '/products' && method === 'GET') {
        try {
            const category = parsedUrl.searchParams.get('category');
            const search = parsedUrl.searchParams.get('search'); // Accepts ?search=keyword parameter natively
            const items = await getCatalog(category, search);
            return sendJsonResponse(200, { message: "Operational catalog filtered output resolved.", products: items });
        } catch (err) {
            return sendJsonResponse(500, { error: err.message });
        }
    }

    // 4. Admin Product Seeding Route
    if (pathname === '/products' && method === 'POST') {
        try {
            const body = await parseRequestBody(req);
            const newProduct = await Product.create({
                name: body.name,
                description: body.description,
                category: body.category,
                price: body.price,
                stock: body.stock
            });
            return sendJsonResponse(201, { message: "Product added to catalog successfully", productId: newProduct._id });
        } catch (err) {
            return sendJsonResponse(400, { error: err.message });
        }
    }

    // --- Protected Session Resource Interceptor Isolation Boundaries ---
    if (pathname.startsWith('/cart') || pathname.startsWith('/orders')) {
        const sessionUser = verifyCustomerSession(req.headers['authorization']);
        
        if (!sessionUser) {
            return sendJsonResponse(401, { error: "Access Denied: Customer authentication required." });
        }

        // Add Product to Cart
        if (pathname === '/cart' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const cartUpdate = await appendToCart(sessionUser.id, body);
                return sendJsonResponse(200, { message: "Item added to cart successfully", cart: cartUpdate });
            } catch (err) { 
                return sendJsonResponse(400, { error: err.message }); 
            }
        }

        // Remove/Decrement Product From Cart
        if (pathname === '/cart/remove' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const cartUpdate = await removeFromCart(sessionUser.id, body);
                return sendJsonResponse(200, { message: "Item adjusted inside cart successfully", cart: cartUpdate });
            } catch (err) {
                return sendJsonResponse(400, { error: err.message });
            }
        }

        // Checkout Cart & Process Payment
        if (pathname === '/orders' && method === 'POST') {
            try {
                const body = await parseRequestBody(req);
                const invoice = await checkoutCart(sessionUser.id, body);
                return sendJsonResponse(201, { message: "Order and mock payment transaction executed successfully", order: invoice });
            } catch (err) { 
                return sendJsonResponse(400, { error: err.message }); 
            }
        }
    }

    return sendJsonResponse(404, { error: 'Target commercial API route path could not be resolved.' });
}

async function main() {
    await connectDatabase();

    const server = createServer(async (req, res) => {
        try { 
            await handleRequest(req, res); 
        } catch (err) {
            console.error('Store Server Exception Caught:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal systemic inventory checkout routing breakdown.' }));
        }
    });

    server.listen(PORT, () => {
        console.log(`🚀 Scalable E-Commerce Platform API listening on network port: ${PORT}`);
    });
}

main();