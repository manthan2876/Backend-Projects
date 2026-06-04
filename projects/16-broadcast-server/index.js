import { createServer } from 'net';

const PORT = 8080;

// Global in-memory registry pool tracking active, live client TCP sockets
const connectedClientsRegistry = [];

/**
 * Distributes incoming string data to all active clients except the originating author socket.
 * @param {string} message - Raw clean message payload to distribute.
 * @param {Object} originatingSocket - The specific net.Socket instance that generated the event.
 */
function broadcastEventMessage(message, originatingSocket) {
    // Loop through the connectedClientsRegistry array collection
    for (const clientSocket of connectedClientsRegistry) {
        // Verify client socket is not equal to originatingSocket and clientSocket is still alive
        if (clientSocket !== originatingSocket && !clientSocket.destroyed) {
            // Transmit string payload using clientSocket.write()
            clientSocket.write(message + '\n');
        }
    }
}

/**
 * Helper function to safely purge a dead socket connection from the global tracking registry.
 * @param {Object} socket - The specific net.Socket instance to disconnect.
 */
function removeClientFromRegistry(socket) {
    const index = connectedClientsRegistry.indexOf(socket);
    if (index !== -1) {
        connectedClientsRegistry.splice(index, 1);
    }
}

/**
 * Orchestrates incoming network connections, lifecycle state events, and streaming channels.
 */
function main() {
    const server = createServer((socket) => {
        // Assign basic identity naming properties to track connection logs inside server console stdout
        const clientIdentityKey = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`[System Notice]: New pipeline connected dynamically out of origin path: ${clientIdentityKey}`);

        // Push newly initialized socket reference safely down into the global connectedClientsRegistry array
        connectedClientsRegistry.push(socket);
        
        // Welcome message sent directly back to the newly attached client terminal instance
        socket.write('Welcome to the Central Broadcast Server Network Core!\n');
        broadcastEventMessage(`[System Notice]: User ${clientIdentityKey} joined the server workspace chat.`, socket);

        // --- Stream Listener 1: Capturing Incoming Data Traffic Chunks ---
        socket.on('data', (bufferChunk) => {
            const rawText = bufferChunk.toString().trim();
            if (!rawText) return;

            console.log(`[Log From ${clientIdentityKey}]: ${rawText}`);

            // Format custom broadcast text format block
            const formattedText = `[${clientIdentityKey}]: ${rawText}`;
            
            // Invoke broadcastEventMessage to sync changes out globally
            broadcastEventMessage(formattedText, socket);
        });

        // --- Stream Listener 2: Client Normal Connection Termination Event ---
        socket.on('end', () => {
            console.log(`[System Notice]: Connection gracefully closing down tracking paths from: ${clientIdentityKey}`);
            // Locate socket position inside connectedClientsRegistry index pool and splice it out safely
            removeClientFromRegistry(socket);
        });

        // --- Stream Listener 3: Sudden Pipeline Socket Communications Disruptions/Error Events ---
        socket.on('error', (err) => {
            console.error(`[Connection Anomaly Caught from ${clientIdentityKey}]:`, err.message);
            // Ensure any internal socket cleanup functions run safely here to prevent server memory leak crashes
            removeClientFromRegistry(socket);
        });

        // --- Stream Listener 4: Absolute Socket Breakdown Close Cleanup Routine ---
        socket.on('close', () => {
            console.log(`[System Notice]: Socket breakdown lifecycle loop finalized for: ${clientIdentityKey}`);
            
            // Double check registry array lists, ensuring stale dead references are completely filtered out
            removeClientFromRegistry(socket);
            broadcastEventMessage(`[System Notice]: User ${clientIdentityKey} has left the network chat workspace.`, socket);
        });
    });

    // Boot the persistent network listener pipeline channel bound to target ports
    server.listen(PORT, () => {
        console.log(`Native TCP Broadcast Server actively listening for socket lines on port: ${PORT}`);
        console.log('Connect to this server using your terminal terminal command tool via: telnet localhost 8080 or nc localhost 8080');
    });
}

main();