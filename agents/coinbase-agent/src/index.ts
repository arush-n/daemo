import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { config } from './config';
import { initializeDaemoService, startHostedConnection } from './services/daemoService';

const PORT = config.server.port;

async function main() {
    console.log("Starting Coinbase Portfolio Manager Agent...");
    console.log(`Environment: PORT=${PORT}, DAEMO_URL=${config.daemo.gatewayUrl}`);

    try {
        // 1. Initialize Service & Build Session Data
        const sessionData = initializeDaemoService();

        // 3. Start HTTP Server (Inbound REST API)
        app.listen(PORT, () => {
            console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
        });

        // 2. Start Secure Connection (Outbound Tunnel) - Non-blocking for sandbox testing
        startHostedConnection(sessionData).catch(err => {
            console.error("Daemo Hosted Connection Failed (Expected in Sandbox/Offline mode):", err.message);
        });

        // Keep process alive
        console.log("Agent is running. Press Ctrl+C to stop.");
        await new Promise(() => { }); // Never resolve

    } catch (error) {
        console.error("Agent Failed to Start:", error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Unhandled Error:", err);
    process.exit(1);
});
