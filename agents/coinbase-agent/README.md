# Coinbase AI Crypto Portfolio Manager

An AI-powered agent that helps you manage your crypto portfolio, track balances, and analyze market trends using the **Coinbase Advanced API** and **Daemo Engine**.

> **⚠️ SANDBOX MODE**: By default, this agent is configured to use the **Coinbase Sandbox** (`api-sandbox.coinbase.com`). To use the Production API with real funds, verify your `src/services/coinbaseService.ts` configuration and remove the custom sandbox URL.

> **Note**: This agent exclusively uses the [Coinbase Advanced API](https://docs.cloud.coinbase.com/advanced-trade-api/docs/welcome) for trading and portfolio management. It does **not** use the Onramp/Offramp APIs, which are for fiat integration.

## 🚀 Features

This agent is equipped with detailed analytics and reporting capabilities:

### 💰 Deep Portfolio Management
-   **Detailed Reporting**: Generates a comprehensive report including:
    -   Total Portfolio Value in USD.
    -   Asset Allocation percentages.
    -   Real-time balance valuation.
    -   *Query: "Give me a detailed portfolio report."*
-   **Balance Tracking**: Check your current crypto holdings and their availability.
    -   *Query: "What is my current balance?"*
-   **Transaction History** (Stub): Acknowledges requests for past trades (Coming Soon).
    -   *Query: "Show my past trades."*
-   **Deposit Addresses**: Retrieve your wallet address for deposits.
    -   *Query: "What is my BTC deposit address?"*

### 📈 Advanced Market Analysis
-   **Market Intelligence**: The agent can "explain" price movements by analyzing:
    -   Recent price candles (OHLC).
    -   24-hour Market Stats (Volume, High, Low).
    -   Real-time Spot Prices.
    -   *Query: "Explain Bitcoin's movement over the last 5 days."* or *"Analyze ETH for me."*
-   **Market Depth**: View the order book (bids/asks) for liquidity checks.
    -   *Query: "Show me the order book for ETH-USD."*

### 🔄 Trading & Orders (Active Management)
-   **Discovery**: View available trading pairs.
    -   *Query: "List available USD trading pairs."*
-   **Open Orders**: List currently active (open) orders.
    -   *Query: "Do I have any open orders?"*
-   **Cancel Orders**: Cancel specific open orders to manage risk.
    -   *Query: "Cancel order 12345."* or *"Cancel my open buy orders."*

-   **Fee Estimation** (Stub): Acknowledges requests for fee checks (Coming Soon).
    -   *Query: "What are the fees for this trade?"*

## 🛠️ Architecture

The agent follows a modular architecture:
-   **`src/services/coinbaseService.ts`**: Core logic for interactions (Balance, Product Stats, Market Analysis).
-   **`src/services/coinbaseFunctions.ts`**: Daemo schema definitions and tool wrappers (includes Zod validation).
-   **`src/controllers/agentController.ts`**: Handles incoming queries from the Daemo Engine.

## 📦 Prerequisites

1.  **Node.js**: v16 or higher.
2.  **Coinbase Advanced API Key**: Created at [portal.cdp.coinbase.com](https://portal.cdp.coinbase.com/access/api). Requires `view` permissions.
3.  **Daemo API Key**: From [engine.daemo.ai](https://engine.daemo.ai).

## ⚙️ Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Copy the example file and fill in your credentials:
    ```bash
    cp .env.example .env
    ```
    
    Edit `.env`:
    ```env
    COINBASE_API_KEY="your_cdp_key_name"
    COINBASE_API_SECRET="your_cdp_private_key"
    DAEMO_SECRET_KEY="your_daemo_key"
    ```

## 🏃‍♂️ Usage

1.  **Start the Agent**
    ```bash
    npm run dev
    ```
    You should see: `[Daemo] Hosted connection started successfully`.

2.  **Verification**
    -   **Health Check**: `curl http://localhost:5000/health`
    -   **Ask Questions (via Daemo Playground)**:
        -   "What is my portfolio worth in USD?"
        -   "Analyze BTC performance today."
        -   "Do I have any active limit orders?"

## 🧪 Testing

Run strict TypeScript build checks:
```bash
npm run build
```