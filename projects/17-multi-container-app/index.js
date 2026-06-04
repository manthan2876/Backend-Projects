import 'dotenv/config'; 
import { createServer } from 'http';
import { MongoClient } from 'mongodb';

// Configuration parameter mapping with absolute safe fallback boundaries
const PORT = process.env.PORT || 3000;
const MONGO_CONNECTION_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/infrastructure_db';

let dbClient = null;
let databaseInstance = null;

/**
 * Orchestrates incoming HTTP requests and tracks connection pipelines.
 */
async function handleServerConnection(req, res) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/status' || pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: "Online",
            message: "Multi-container backend infrastructure core operational template.",
            databaseConfigurationHostString: MONGO_CONNECTION_URI ? "Configured" : "Missing",
            databaseConnectivityState: databaseInstance ? "Connected & Synchronized" : "Disconnected"
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Target resource API path route maps could not be resolved." }));
}

/**
 * Boots the application web system native server listeners after resolving data layer links.
 */
async function main() {
    try {
        console.log('Initializing multi-container backend core pipeline...');
        
        if (!MONGO_CONNECTION_URI) {
            throw new Error("Initialization Failure: Target environment variable MONGO_URI is completely missing.");
        }

        dbClient = new MongoClient(MONGO_CONNECTION_URI);
        await dbClient.connect();
        
        databaseInstance = dbClient.db(); 
        console.log('✅ Asynchronous connection to database pipeline established successfully.');

        const server = createServer(async (req, res) => {
            try {
                await handleServerConnection(req, res);
            } catch (err) {
                console.error('System pipeline parsing error caught:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'System request parsing framework boundary error.' }));
            }
        });

        server.listen(PORT, () => {
            console.log(`🚀 Containerized API Server Platform running inside container instance on port: ${PORT}`);
        });

    } catch (criticalErr) {
        console.error('❌ Critical Infrastructure Boot Failure System Terminated:', criticalErr.message);
        process.exit(1);
    }
}

process.on('uncaughtException', (err) => {
    console.error('System encountered an unhandled execution failure anomaly:', err.message);
    process.exit(1);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal intercepted: Terminating connection channels.');
    if (dbClient) {
        await dbClient.close();
        console.log('MongoDB connections drained cleanly.');
    }
    process.exit(0);
});

main();