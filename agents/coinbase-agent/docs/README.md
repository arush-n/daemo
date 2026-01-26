# Why Coinbase Advanced API?

We have chosen the **Coinbase Advanced API** (formerly Advanced Trade API) for this AI Portfolio Manager.

## Reasoning
The user requested an agent that can:
1.  **Track Balances**: Monitor crypto holdings.
2.  **Explain Price Movements**: Analyze market trends.
3.  **Generate Reports**: Synthesize data.

The **Advanced API** is the "most useful" choice because:
-   **Unified Access**: It provides a single interface for both Account/Portfolio data (`/accounts`) and Market Data (`/products/.../candles`).
-   **Granularity**: It offers detailed market data (candles/ohlc) which is critical for the AI to "explain price movements". The standard "Sign in with Coinbase" API lacks this depth of market data.
-   **Future Proofing**: It is the modern replacement for the legacy "Exchange/Pro" APIs.
-   **Trading Capabilities**: While primarily a manager, using this API leaves the door open for future trading features (buying/selling) without switching libraries.
