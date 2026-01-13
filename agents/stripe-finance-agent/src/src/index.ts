import 'reflect-metadata';
import * as dotenv from 'dotenv';
import app from './app';
import { initializeDaemoService, startHostedConnection } from './services/daemoService';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function main() {
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
