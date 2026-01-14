import { Request, Response } from 'express';
import { DaemoClient } from 'daemo-engine';

export class AgentController {

    public static async handleQuery(req: Request, res: Response): Promise<void> {
        try {
            const { query, threadId } = req.body;

            if (!query) {
                res.status(400).json({ error: "Missing 'query' in request body" });
                return;
            }

            console.log(`[AgentController] Received Query: ${query}`);

            // Defensive: Check and Reload .env if needed
            if (!process.env.DAEMO_SECRET_KEY) {
                console.warn("[AgentController] WARN: Secret Key missing in process.env. Attempting to reload .env...");
                const dotenv = require('dotenv');
                const path = require('path');
                dotenv.config({ path: path.resolve(process.cwd(), '.env') });
            }

            const apiKey = process.env.DAEMO_SECRET_KEY;
            console.log(`[AgentController] Final Secret Key Check: ${apiKey ? 'Present' : 'MISSING'}`);
            if (apiKey) console.log(`[AgentController] Key Length: ${apiKey.length}, First 5: ${apiKey.substring(0, 5)}...`);

            // Instantiate Client
            let agentUrl = process.env.DAEMO_AGENT_URL || process.env.DAEMO_GATEWAY_URL || "https://engine.daemo.ai:50052";

            // Ensure it starts with https:// if it doesn't (assuming secure by default for daemo.ai)
            if (!agentUrl.startsWith("http")) {
                agentUrl = `https://${agentUrl}`;
            }

            console.log(`[AgentController] Using Agent URL: ${agentUrl}`);

            const client = new DaemoClient({
                agentApiKey: apiKey,
                daemoAgentUrl: agentUrl
            });

            // Process with Daemo
            const result = await client.processQuery(query, {
                threadId: threadId
            });

            res.json(result);

        } catch (error: any) {
            console.error("[AgentController] Error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                details: error.message
            });
        }
    }
}
