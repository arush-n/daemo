import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initializeDaemoService, startHostedConnection } from './services/daemoService';

const PORT = process.env.PORT || 5000;

// DEBUG: Test route removed

async function main() {
    console.log("DEBUG: Starting main function...");
    console.log("DEBUG: Environment check - PORT:", process.env.PORT);
    console.log("DEBUG: Environment check - DAEMO_SECRET_KEY:", process.env.DAEMO_SECRET_KEY ? "Set" : "Not Set");
    console.log("DEBUG: Environment check - DAEMO_AGENT_URL:", process.env.DAEMO_AGENT_URL);
    console.log("DEBUG: Environment check - DAEMO_GATEWAY_URL:", process.env.DAEMO_GATEWAY_URL);

    console.log("Starting Stripe Finance Agent (Daemo Edition)...");

    try {
        // 1. Initialize Service & Build Session Data
        const sessionData = initializeDaemoService();

        // 2. Start Secure Connection (Outbound Tunnel)
        const hostedPromise = startHostedConnection(sessionData);

        // 3. Start HTTP Server (Inbound REST API)
        const serverPromise = new Promise<void>((resolve) => {
            app.listen(PORT, () => {
                console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
                console.log("DEBUG: Server is ready to handle requests.");
                resolve();
            });
        });

        await Promise.all([hostedPromise, serverPromise]);

    } catch (error) {
        console.error("Agent Failed to Start:", error);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("Unhandled Error:", err);
    process.exit(1);
});
