import { Coinbase, CandleGranularity, OrderStatus, OrderSide } from 'coinbase-advanced-node';
import { config } from '../config';

// Define specialized types for our service response
export interface Balance {
    currency: string;
    value: number;
    available: number;
    held: number;
}

export class CoinbaseService {
    private client: Coinbase;

    constructor() {
        if (!config.coinbase.apiKey || !config.coinbase.apiSecret) {
            throw new Error("Coinbase API credentials not found in environment.");
        }

        console.warn("⚠️  WARNING: Running in SANDBOX mode (https://api-sandbox.coinbase.com). Real data/trading is disabled. ⚠️");

        this.client = new Coinbase({
            apiKey: config.coinbase.apiKey,
            apiSecret: config.coinbase.apiSecret,
            advTradeHttpUrl: "https://api-sandbox.coinbase.com"
        });
    }

    /**
     * Fetches the current account balances.
     * Filters out zero balances by default.
     */
    async getPortfolioBalance(): Promise<Balance[]> {
        try {
            // client.rest.account.listAccounts() returns Promise<PaginatedData<Account>>
            const response = await this.client.rest.account.listAccounts();

            const accounts = response.data; // PaginatedData has 'data' property

            if (!accounts) {
                return [];
            }

            const balances: Balance[] = accounts
                .map((account: any) => ({
                    currency: account.currency,
                    // SDK might return strings for calculations, casting to float for report
                    value: parseFloat(account.available_balance.value) + parseFloat(account.hold.value),
                    available: parseFloat(account.available_balance.value),
                    held: parseFloat(account.hold.value)
                }))
                .filter((b: Balance) => b.value > 0);

            return balances;
        } catch (error: any) {
            console.error("Error fetching portfolio balance:", error);
            // Fallback: return empty if API fails (e.g. invalid keys)
            return [];
        }
    }

    /**
     * Fetches historical candles for a specific product.
     * Useful for explaining price movements.
     * 
     * @param productId - e.g., "BTC-USD"
     * @param granularity - ONE_MINUTE, FIVE_MINUTE, ONE_HOUR, SIX_HOUR, ONE_DAY
     */
    async getProductCandles(productId: string, start?: number, end?: number, granularity: string = 'ONE_DAY'): Promise<any[]> {
        try {
            // Map string granularity to SDK Enum
            let sdkGranularity = CandleGranularity.ONE_DAY;
            if (granularity === 'ONE_HOUR') sdkGranularity = CandleGranularity.ONE_HOUR;
            if (granularity === 'FIVE_MINUTE') sdkGranularity = CandleGranularity.FIVE_MINUTE;

            // Ensure we have start/end if required, or let SDK defaults handle it
            const uniqueStart = start || Math.floor(Date.now() / 1000) - 86400; // 24h ago
            const uniqueEnd = end || Math.floor(Date.now() / 1000);

            const response = await this.client.rest.product.getCandles(productId, {
                granularity: sdkGranularity,
                start: uniqueStart,
                end: uniqueEnd
            });

            return response || [];
        } catch (error: any) {
            console.error(`Error fetching candles for ${productId}:`, error);
            return [];
        }
    }

    async getProductStats(productId: string): Promise<any> {
        try {
            const stats = await this.client.rest.product.getProductStats(productId);
            return stats;
        } catch (error: any) {
            console.error(`Error fetching stats for ${productId}:`, error);
            return null;
        }
    }

    /**
     * Aggregates multiple data points for a comprehensive market analysis.
     */
    async getMarketAnalysis(productId: string): Promise<any> {
        const [candles, stats, price] = await Promise.all([
            this.getProductCandles(productId, undefined, undefined, 'ONE_DAY'),
            this.getProductStats(productId),
            this.getSpotPrice(productId)
        ]);

        return {
            productId,
            currentPrice: price,
            stats24h: stats,
            recentCandles: candles.slice(0, 5) // Return last 5 days for context
        };
    }

    /**
     * Generates a detailed portfolio report with USD values and allocation.
     */
    async generateAdvancedReport(): Promise<string> {
        const balances = await this.getPortfolioBalance();
        if (balances.length === 0) return "No non-zero balances found.";

        let report = "Coinbase Portfolio Report (Detailed):\n";
        report += "------------------------------------\n";

        let totalUsdValue = 0;
        const enrichedBalances = [];

        // Fetch prices to calculate USD value - typically USDC/USD = 1
        for (const b of balances) {
            let price = 0;
            if (b.currency === 'USD' || b.currency === 'USDC') {
                price = 1;
            } else {
                const product = `${b.currency}-USD`;
                const priceStr = await this.getSpotPrice(product);
                price = priceStr !== 'Error' && priceStr !== 'Unknown' ? parseFloat(priceStr) : 0;
            }
            const usdValue = b.value * price;
            totalUsdValue += usdValue;
            enrichedBalances.push({ ...b, usdValue, price });
        }

        report += `Total Portfolio Value: $${totalUsdValue.toFixed(2)}\n\n`;
        report += "Asset Allocation:\n";

        for (const b of enrichedBalances) {
            const allocation = totalUsdValue > 0 ? (b.usdValue / totalUsdValue) * 100 : 0;
            report += `- ${b.currency}: ${b.value.toFixed(4)} | Value: $${b.usdValue.toFixed(2)} (${allocation.toFixed(1)}%)\n`;
        }

        return report;
    }

    /**
     * Generates a simple text summary of the portfolio.
     * Legacy support, now pointing to advanced report if preferred, or keeping simple.
     * User requested detailed reports, so we upgrade this default method.
     */
    async generateReport(): Promise<string> {
        return this.generateAdvancedReport();
    }

    /**
     * Fetches open orders.
     * Useful for "Do I have any active trades?"
     */
    async getOpenOrders(): Promise<any[]> {
        try {
            const response = await this.client.rest.order.getOrders({
                order_status: [OrderStatus.OPEN]
            });
            return response.data || [];
        } catch (error: any) {
            console.error("Error fetching open orders:", error);
            return [];
        }
    }

    /**
     * Gets the current spot price (market mid-price or last trade).
     */
    async getSpotPrice(productId: string): Promise<string> {
        try {
            // getProduct returns a single Product object with 'price' field
            const product = await this.client.rest.product.getProduct(productId);
            if (product) {
                return product.price; // string
            }
            return "Unknown";
        } catch (error: any) {
            // Common error if product doesn't exist (e.g. liquidity issue)
            // console.error(`Error fetching price for ${productId}:`, error);
            return "Unknown";
        }
    }
    /**
     * STUB: Fetches transaction summary.
     * Planned for future release to analyze user's trading history.
     */
    async getTransactionsSummary(): Promise<string> {
        return "Transaction summary feature is coming soon. This will allow analysis of your past trades and transfers.";
    }

    /**
     * STUB: Estimates fees for a hypothetical order.
     * Planned for future release to help users calculate costs before trading.
     */
    async getFeeEstimate(productId: string, amount: string): Promise<string> {
        return `Fee estimation for ${amount} of ${productId} is not yet implemented. Please check the Coinbase Advanced documentation for fee tiers.`;
    }

    async getDepositAddress(currencyCode: string): Promise<string> {
        try {
            // 1. Find the account ID for this currency
            const accountsRes = await this.client.rest.account.listAccounts();
            const account = accountsRes.data.find((a: any) => a.currency === currencyCode.toUpperCase());

            if (!account) {
                return `No account found for ${currencyCode}.`;
            }

            // 2. Get addresses for this account
            const addressesRes = await this.client.rest.address.listAddresses(account.uuid);
            const addresses = addressesRes.data;

            if (addresses.length > 0) {
                return addresses[0].address;
            }

            return `No deposit address found for ${currencyCode}. You may need to generate one in the Coinbase UI first.`;

        } catch (error: any) {
            console.error(`Error fetching address for ${currencyCode}:`, error);
            return "Error retrieving deposit address.";
        }
    }

    async getProductBook(productId: string): Promise<any> {
        try {
            // Limit to 10 bids/asks to keep context small
            const book = await this.client.rest.product.getProductBook(productId, { limit: 10 } as any);
            return book;
        } catch (error: any) {
            console.error(`Error fetching order book for ${productId}:`, error);
            return null;
        }
    }

    /**
     * Lists available trading pairs, optionally filtered by type.
     */
    async listProducts(productType: string = 'SPOT'): Promise<any[]> {
        try {
            const response = await this.client.rest.product.getProducts({ product_type: productType });
            // Return simplified list to save context window
            return response.map((p: any) => ({
                id: p.product_id,
                price: p.price,
                status: p.status
            })).slice(0, 50); // Limit to 50
        } catch (error: any) {
            console.error("Error listing products:", error);
            return [];
        }
    }

    /**
     * Cancels specific open orders.
     */
    async cancelOrder(orderIds: string[]): Promise<any[]> {
        try {
            const response = await this.client.rest.order.cancelOpenOrders(orderIds);
            return response;
        } catch (error: any) {
            console.error("Error cancelling order:", error);
            return [];
        }
    }
}
