import { Request, Response } from 'express';
import { DaemoClient } from 'daemo-engine';
import { config } from '../config';

export class AgentController {

    public static async handleQuery(req: Request, res: Response): Promise<void> {
        try {
            const { query, threadId } = req.body;

            if (!query) {
                res.status(400).json({ error: "Missing 'query' in request body" });
                return;
            }

            console.log(`[AgentController] Received Query: ${query}`);

            const apiKey = config.daemo.secretKey;

            // Instantiate Client
            let agentUrl = config.daemo.agentUrl || "https://engine.daemo.ai:50052";

            if (!agentUrl.startsWith("http")) {
                agentUrl = `https://${agentUrl}`;
            }

            const client = new DaemoClient({
                agentApiKey: apiKey,
                daemoAgentUrl: agentUrl
            });

            // Process with Daemo
            // Note: In a real hosted scenario, the Engine calls US back through the tunnel.
            // This 'handleQuery' is mostly for local testing via HTTP -> Engine -> Agent Loop
            // Or if we act as a client trigger.
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
