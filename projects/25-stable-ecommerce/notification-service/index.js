// notification-service/index.js
import 'dotenv/config';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3002;
const INVOICES_DIR = process.env.INVOICES_DIR || (fs.existsSync('/invoices') ? '/invoices' : path.resolve('./invoices'));

if (!fs.existsSync(INVOICES_DIR)) fs.mkdirSync(INVOICES_DIR, { recursive: true });

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    });
}

async function handleRequest(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    
    if (parsedUrl.pathname === '/notify/invoice' && req.method === 'POST') {
        const task = await parseRequestBody(req);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'Processing triggered' }));

        // Asynchronous worker segment running out-of-band away from order pipeline thread blocks
        (async () => {
            try {
                console.log(`[Worker]: Starting generation matrix processing for order id: ${task.orderId}`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate file compression overheads

                const fileContent = `
========================================
COMMERCIAL INVOICE TRANSACTION RECORD
========================================
Order Reference Token: ${task.orderId}
Reconciliation Value: $${task.finalAmount.toFixed(2)}
Manifest entries:
${task.items.map(i => ` - ${i.name} (Qty: ${i.qty})`).join('\n')}
========================================`;

                fs.writeFileSync(path.join(INVOICES_DIR, `invoice-${task.orderId}.txt`), fileContent, 'utf8');
                console.log(`[Worker Success]: Invoice invoice-${task.orderId}.txt written cleanly.`);
            } catch (err) {
                console.error('[Worker Error]: File writing system error caught:', err.message);
            }
        })();
        return;
    }

    res.writeHead(404);
    res.end();
}

createServer(handleRequest).listen(PORT, () => {
    console.log(`⚡ Async Notification/Invoice Service online running on port: ${PORT}`);
});