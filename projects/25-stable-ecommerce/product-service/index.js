// product-service/index.js
import 'dotenv/config';
import { createServer } from 'http';
import mongoose from 'mongoose';

const PORT = process.env.PRODUCT_SERVICE_PORT || 3001;

// Separate database instance for domain isolation
mongoose.connect(process.env.MONGO_PRODUCT_URI || 'mongodb://127.0.0.1:27017/shop_products');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stockQuantity: { type: Number, required: true, min: 0 }
});
const Product = mongoose.model('Product', ProductSchema);

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const sendJson = (statusCode, payload) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payload));
    };

    // Inventory Validation and Deduction Endpoint called by Order Service
    if (parsedUrl.pathname === '/products/reserve' && req.method === 'POST') {
        try {
            const { items } = await parseRequestBody(req);
            
            // Validate stock allocations before applying mutations
            for (const item of items) {
                const product = await Product.findById(item.productId);
                if (!product) return sendJson(404, { error: `Product ${item.productId} not found.` });
                if (product.stockQuantity < item.qty) {
                    return sendJson(409, { error: `Stock exhaustion for item: ${product.name}` });
                }
            }

            // Deduct inventory rows
            const updatedItems = [];
            for (const item of items) {
                const product = await Product.findById(item.productId);
                product.stockQuantity -= item.qty;
                await product.save();
                updatedItems.push({ productId: product._id, name: product.name, price: product.price, qty: item.qty });
            }

            return sendJson(200, { message: 'Stock locked successfully', items: updatedItems });
        } catch (err) {
            return sendJson(500, { error: err.message });
        }
    }

    // Seeding endpoint to easily add items during testing
    if (parsedUrl.pathname === '/products' && req.method === 'POST') {
        const body = await parseRequestBody(req);
        const newProduct = await Product.create(body);
        return sendJson(201, newProduct);
    }

    return sendJson(404, { error: 'Not Found' });
}

createServer(handleRequest).listen(PORT, () => {
    console.log(`📦 Product Catalog Service online running on port: ${PORT}`);
});