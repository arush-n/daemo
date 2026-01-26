import { DaemoBuilder, DaemoHostedConnection, SessionData } from "daemo-engine";
import { CoinbaseFunctions } from "./coinbaseFunctions";
import { config } from "../config";

let hostedConnection: DaemoHostedConnection | null = null;

const systemPrompt = `
You are an expert Coinbase Crypto Portfolio Manager Agent.
Your goal is to assist users by tracking their crypto balances, analyzing market trends, and generating portfolio reports.

## ⚠️ CRITICAL: EXECUTION RULES
1. **SINGLE OBJECT ARGUMENTS**: Tools allow a single JSON object.
2. **SECURITY**:
   - Do NOT reveal private keys or secrets.
   - Summarize data, do not dump raw JSON unless asked.

## 🛠️ TOOLKIT

### 1. getPortfolioBalance
- **Description**: Fetches all non-zero balances.
- **Use for**: "How much crypto do I have?"

### 2. generateReport
- **Description**: Generates a detailed portfolio report including USD value, asset allocation, and recent performance.
- **Use for**: "Portfolio report", "What is my portfolio worth?"

### 3. analyzeMarket
- **Description**: Deep dive analysis for a product (default BTC-USD). Returns current price, 24h stats (volume/change), and recent daily candles.
- **Use for**: "Explain BTC movement", "Market analysis for ETH", "Why is the price moving?"

### 4. listOpenOrders
- **Description**: Checks for active open orders.
- **Use for**: "Do I have open trades?"

### 5. checkSpotPrice
- **Description**: Gets the current price of an asset (e.g. BTC-USD).
- **Use for**: "What is the price of X?"

### 6. checkTransactionSummary (Coming Soon)
- **Description**: Placeholder for transaction history.
- **Use for**: "Show my past trades" (Will return a "coming soon" message).

### 7. checkFeeEstimate (Coming Soon)
- **Description**: Placeholder for fee estimation.
- **Use for**: "What are the fees for this trade?" (Will return a "coming soon" message).
### 8. getDepositAddress
- **Description**: Retrieves your wallet address for deposits.
- **Use for**: "What is my BTC address?", "How can I deposit ETH?"

### 9. checkMarketLiquidity
- **Description**: Views the order book (bids and asks).
- **Use for**: "Check order book", "How thick is the buy side?"

### 10. listProducts
- **Description**: Lists available trading pairs.
- **Use for**: "What can I trade?", "List USD pairs"

### 11. cancelOrder
- **Description**: Cancels one or more open orders.
- **Use for**: "Cancel my open BTC order", "Stop all trades"


`;

export function initializeDaemoService(): SessionData {
    console.log("[Daemo] Initializing Daemo service...");

    const builder = new DaemoBuilder()
        .withServiceName("CoinbaseManagerAgent")
        .withSystemPrompt(systemPrompt);

    const functions = new CoinbaseFunctions();
    builder.registerService(functions);

    const sessionData = builder.build();
    console.log(`[Daemo] Configuration built successfully.`);

    return sessionData;
}

export async function startHostedConnection(sessionData: SessionData): Promise<void> {
    const agentApiKey = config.daemo.secretKey;

    if (!agentApiKey) {
        console.warn("[Daemo] DAEMO_SECRET_KEY not set. Hosted connection will not start.");
        return;
    }

    // Handle 'mock_key' for testing environments
    const effectiveKey = agentApiKey;

    // Sanitize Gateway URL
    let gatewayUrl = config.daemo.gatewayUrl || "https://engine.daemo.ai:50052";

    if (!gatewayUrl.startsWith("http")) {
        gatewayUrl = `https://${gatewayUrl}`;
    }

    console.log(`[Daemo] Using Gateway URL: ${gatewayUrl}`);

    hostedConnection = new DaemoHostedConnection(
        {
            agentApiKey: effectiveKey,
            daemoGatewayUrl: gatewayUrl
        },
        sessionData
    );

    await hostedConnection.start();
    console.log("[Daemo] Hosted connection started successfully");
}
