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

            // Instantiate Client
            const client = new DaemoClient({
                agentApiKey: process.env.DAEMO_AGENT_API_KEY
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
