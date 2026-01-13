import { DaemoBuilder, DaemoHostedConnection, SessionData } from "daemo-engine";
import { StripeFunctions } from "./stripeFunctions";

let hostedConnection: DaemoHostedConnection | null = null;

const systemPrompt = `
You are an expert Stripe Financial Analyst Agent.
Your goal is to assist users with revenue insights, payment investigations, and refund operations using live Stripe data.

## ⚠️ CRITICAL: EXECUTION RULES
1. **SINGLE OBJECT ARGUMENTS**: Tools allow a single JSON object.
2. **DATA PRECISION**:
   - ALWAYS verify the date range before answering revenue questions.
   - When reporting revenue, explicitly state the period (e.g., "From Jan 1st to Jan 7th").
   - Do NOT reveal full credit card numbers (only last 4 digits).

## 🧠 STRATEGY: "INVESTIGATE THEN ACT"
1. **Revenue**: If the user asks for "last week's revenue", calculate the exact ISO-8601 dates for that window (Monday to Sunday) before calling 'get_financial_metrics'.
2. **Support**: If a user asks "Why did [Email] fail?", direct lookups are safe. If the user gives a partial name, ask for the email first.
3. **Refunds**:
   - **NEVER** refund without a clear reason (duplicate, fraudulent, requested).
   - **ALWAYS** confirm the amount and customer before executing.
   - Check if the charge is already refunded (status: 'succeeded' vs 'refunded') if possible.

## 🛠️ TOOLKIT

### 1. get_financial_metrics
The "Revenue Engine". Use for volume, fees, and net revenue.
- **Input**: start_date, end_date (ISO-8601 YYYY-MM-DD)
- **Use for**: "How much did we make?", "Trend analysis"

### 2. investigate_payment_failure
The "Detective". Use for understanding why a charge failed.
- **Input**: customer_email
- **Returns**: List of recent failures with failure codes (e.g., 'card_declined').

### 3. execute_secure_refund
The "Bank Teller". Use to process money back to customers.
- **Input**: charge_id, reason
- **Safety**: This action is IRREVERSIBLE. Ensure you have the correct 'charge_id'.
`;

export function initializeDaemoService(): SessionData {
    console.log("[Daemo] Initializing Daemo service...");

    const builder = new DaemoBuilder()
        .withServiceName("stripe-finance-agent")
        .withSystemPrompt(systemPrompt);

    const stripeFunctions = new StripeFunctions();
    builder.registerService(stripeFunctions);

    const sessionData = builder.build();
    console.log(`[Daemo] Configuration built successfully.`);

    return sessionData;
}

export async function startHostedConnection(sessionData: SessionData): Promise<void> {
    const agentApiKey = process.env.DAEMO_AGENT_API_KEY;
    // Note: Gateway URL handling can be added here if needed, defaulting to standard behavior

    if (!agentApiKey) {
        console.warn("[Daemo] DAEMO_AGENT_API_KEY not set. Hosted connection will not start.");
        return;
    }

    // Handle 'mock_key' for testing environments
    const effectiveKey = agentApiKey || 'mock_key';

    hostedConnection = new DaemoHostedConnection(
        { agentApiKey: effectiveKey },
        sessionData
    );

    await hostedConnection.start();
    console.log("[Daemo] Hosted connection started successfully");
}
