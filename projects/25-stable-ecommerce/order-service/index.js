// order-service/index.js
import 'dotenv/config';
import { createServer } from 'http';
import mongoose from 'mongoose';

const PORT = process.env.ORDER_SERVICE_PORT || 3000;
const MONGO_ORDER_URI = process.env.MONGO_ORDER_URI || 'mongodb://127.0.0.1:27017/shop_orders';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://127.0.0.1:3001';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3002';

// Connect to MongoDB
mongoose.connect(MONGO_ORDER_URI);

const OrderSchema = new mongoose.Schema({
    items: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true }
    }],
    finalAmount: { type: Number, required: true },
    status: { type: String, required: true, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => { 
            try { 
                resolve(body ? JSON.parse(body) : {}); 
            } catch { 
                reject(new Error('Invalid JSON')); 
            } 
        });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const sendJson = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // GET /orders
    if (parsedUrl.pathname === '/orders' && req.method === 'GET') {
        try {
            const orders = await Order.find().sort({ createdAt: -1 });
            return sendJson(200, orders);
        } catch (err) {
            return sendJson(500, { error: err.message });
        }
    }

    // POST /orders or POST /checkout
    if ((parsedUrl.pathname === '/orders' || parsedUrl.pathname === '/checkout') && req.method === 'POST') {
        try {
            const { items } = await parseRequestBody(req);
            if (!items || !Array.isArray(items) || items.length === 0) {
                return sendJson(400, { error: 'Items array is required' });
            }

            // Call product-service to reserve stock
            const productResponse = await fetch(`${PRODUCT_SERVICE_URL}/products/reserve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            if (productResponse.status !== 200) {
                const errData = await productResponse.json().catch(() => ({}));
                return sendJson(productResponse.status, errData || { error: 'Stock reservation failed' });
            }

            const { items: reservedItems } = await productResponse.json();

            // Calculate total order amount
            const finalAmount = reservedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

            // Create Order
            const order = await Order.create({
                items: reservedItems,
                finalAmount,
                status: 'Completed'
            });

            // Trigger notification service (asynchronously)
            fetch(`${NOTIFICATION_SERVICE_URL}/notify/invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order._id,
                    finalAmount,
                    items: reservedItems.map(i => ({ name: i.name, qty: i.qty }))
                })
            }).catch(err => {
                console.error('[Order Service]: Async notification trigger failed:', err.message);
            });

            if (parsedUrl.pathname === '/checkout') {
                return sendJson(202, {
                    message: "Order placed successfully. Processing receipt asynchronously.",
                    orderReferenceId: order._id,
                    totalReconciliationValue: finalAmount
                });
            } else {
                return sendJson(201, order);
            }
        } catch (err) {
            return sendJson(500, { error: err.message });
        }
    }

    return sendJson(404, { error: 'Not Found' });
}

createServer(handleRequest).listen(PORT, () => {
    console.log(`🛒 Order Service online running on port: ${PORT}`);
});