import { DaemoFunction } from 'daemo-engine';
import { CoinbaseService } from "./coinbaseService";
import * as Schemas from './coinbase.schemas';

const coinbaseService = new CoinbaseService();

export class CoinbaseFunctions {

    @DaemoFunction({
        description: "Fetches all non-zero balances from the connected Coinbase account. Use for 'How much crypto do I have?' or 'What is my balance?'.",
        tags: ["finance", "balance", "portfolio"],
        category: "Finance",
        inputSchema: Schemas.GetBalanceInputSchema as any,
        outputSchema: Schemas.GetBalanceOutputSchema as any
    })
    async getPortfolioBalance(args: {}): Promise<any> {
        console.log("[Tool] getPortfolioBalance called");
        return await coinbaseService.getPortfolioBalance();
    }

    @DaemoFunction({
        description: "Generates a text summary of the current portfolio. Use for 'Give me a report' or 'Status update'.",
        tags: ["report", "summary"],
        category: "Reporting",
        inputSchema: Schemas.GenerateReportInputSchema as any,
        outputSchema: Schemas.GenerateReportOutputSchema as any
    })
    async generateReport(args: {}): Promise<string> {
        console.log("[Tool] generateReport called");
        return await coinbaseService.generateReport();
    }

    @DaemoFunction({
        description: "Performs a deep market analysis for a product (default BTC-USD). Includes 24h stats, current price, and recent price candles. Use for 'Explain BTC movement' or 'Analyze ETH'.",
        tags: ["market", "analysis", "price", "stats"],
        category: "Market Data",
        inputSchema: Schemas.AnalyzeMarketInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async analyzeMarket(args: { productId?: string }): Promise<any> {
        console.log("[Tool] analyzeMarket called");
        const productId = args.productId || "BTC-USD";
        return await coinbaseService.getMarketAnalysis(productId);
    }

    @DaemoFunction({
        description: "Fetches current open orders (active trades). Use for 'Do I have any open orders?' or 'Check my active trades'.",
        tags: ["trading", "orders"],
        category: "Trading",
        inputSchema: Schemas.ListOpenOrdersInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async listOpenOrders(args: {}): Promise<any> {
        console.log("[Tool] listOpenOrders called");
        return await coinbaseService.getOpenOrders();
    }

    @DaemoFunction({
        description: "Checks the current spot price of a cryptocurrency. Argument 'productId' is required (e.g. 'BTC-USD', 'ETH-USD').",
        tags: ["market", "price"],
        category: "Market Data",
        inputSchema: Schemas.CheckSpotPriceInputSchema as any,
        outputSchema: Schemas.CheckSpotPriceOutputSchema as any
    })
    async checkSpotPrice(args: { productId: string }): Promise<string> {
        console.log(`[Tool] checkSpotPrice called for ${args.productId}`);
        return await coinbaseService.getSpotPrice(args.productId);
    }

    @DaemoFunction({
        description: "STUB: Check transaction summary. Returns a placeholder message as this feature is coming soon.",
        tags: ["finance", "history", "stub"],
        category: "Finance",
        inputSchema: Schemas.CheckTransactionsInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async checkTransactionSummary(args: {}): Promise<string> {
        console.log("[Tool] checkTransactionSummary called");
        return await coinbaseService.getTransactionsSummary();
    }

    @DaemoFunction({
        description: "STUB: Check fee estimate for a trade. Returns a placeholder message.",
        tags: ["trading", "fees", "stub"],
        category: "Trading",
        inputSchema: Schemas.CheckFeeEstimateInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async checkFeeEstimate(args: { productId: string, amount: string }): Promise<string> {
        console.log("[Tool] checkFeeEstimate called");
        return await coinbaseService.getFeeEstimate(args.productId, args.amount);
    }

    @DaemoFunction({
        description: "Retrieves the deposit address for a specific crypto currency.",
        tags: ["finance", "deposit", "wallet"],
        category: "Finance",
        inputSchema: Schemas.GetDepositAddressInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async getDepositAddress(args: { currency: string }): Promise<string> {
        console.log(`[Tool] getDepositAddress called for ${args.currency}`);
        return await coinbaseService.getDepositAddress(args.currency);
    }

    @DaemoFunction({
        description: "Checks market liquidity by viewing the order book (bids/asks). Use for 'Check depth' or 'Show me orders'.",
        tags: ["market", "trading", "liquidity"],
        category: "Market Data",
        inputSchema: Schemas.GetProductBookInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async checkMarketLiquidity(args: { productId: string }): Promise<any> {
        console.log(`[Tool] checkMarketLiquidity called for ${args.productId}`);
        return await coinbaseService.getProductBook(args.productId);
    }

    @DaemoFunction({
        description: "Lists available trading pairs (products).",
        tags: ["market", "discovery"],
        category: "Market Data",
        inputSchema: Schemas.ListProductsInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async listProducts(args: any): Promise<any> {
        return await coinbaseService.listProducts();
    }

    @DaemoFunction({
        description: "Cancels open orders by ID.",
        tags: ["trading", "cancel"],
        category: "Trading",
        inputSchema: Schemas.CancelOrderInputSchema as any,
        outputSchema: Schemas.AnySchema as any
    })
    async cancelOrder(args: { orderIds: string[] }): Promise<any> {
        return await coinbaseService.cancelOrder(args.orderIds);
    }

}
