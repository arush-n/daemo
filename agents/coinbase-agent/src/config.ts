import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    COINBASE_API_KEY: z.string().describe("Coinbase Advanced API Key Name"),
    COINBASE_API_SECRET: z.string().describe("Coinbase Advanced API Private Key"),
    DAEMO_SECRET_KEY: z.string().optional().describe("Daemo Agent Secret Key"),
    DAEMO_AGENT_URL: z.string().optional().default("https://engine.daemo.ai:50052"),
    DAEMO_GATEWAY_URL: z.string().optional().default("https://engine.daemo.ai:50052"),
    PORT: z.string().default("5000"),
});

const env = envSchema.parse(process.env);

export const config = {
    coinbase: {
        apiKey: env.COINBASE_API_KEY,
        apiSecret: env.COINBASE_API_SECRET.replace(/\\n/g, '\n'), // Handle newlines in private key if present
    },
    daemo: {
        secretKey: env.DAEMO_SECRET_KEY,
        agentUrl: env.DAEMO_AGENT_URL,
        gatewayUrl: env.DAEMO_GATEWAY_URL,
    },
    server: {
        port: parseInt(env.PORT, 10),
    }
};
