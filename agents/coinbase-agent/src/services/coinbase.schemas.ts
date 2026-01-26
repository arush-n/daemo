import { z } from "zod";


// --- Tool 0: Generic Any Schema ---
export const AnySchema = z.any();

// --- Tool 1: Get Portfolio Balance ---
export const GetBalanceInputSchema = z.object({});
export type GetBalanceInput = z.infer<typeof GetBalanceInputSchema>;

export const GetBalanceOutputSchema = z.array(z.object({
    currency: z.string(),
    value: z.number(),
    available: z.number(),
    held: z.number()
}));

// --- Tool 2: Generate Report ---
export const GenerateReportInputSchema = z.object({});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.string();

// --- Tool 3: Market Analysis ---
export const AnalyzeMarketInputSchema = z.object({
    productId: z.string().optional().describe("Product ID, e.g. BTC-USD (default)")
});
export type AnalyzeMarketInput = z.infer<typeof AnalyzeMarketInputSchema>;

// --- Tool 4: List Open Orders ---
export const ListOpenOrdersInputSchema = z.object({});
export type ListOpenOrdersInput = z.infer<typeof ListOpenOrdersInputSchema>;

// --- Tool 5: Check Spot Price ---
export const CheckSpotPriceInputSchema = z.object({
    productId: z.string().describe("Product ID, e.g. BTC-USD")
});
export type CheckSpotPriceInput = z.infer<typeof CheckSpotPriceInputSchema>;
export const CheckSpotPriceOutputSchema = z.string();

// --- Tool 6: Check Transactions (Stub) ---
export const CheckTransactionsInputSchema = z.object({});
export type CheckTransactionsInput = z.infer<typeof CheckTransactionsInputSchema>;

// --- Tool 7: Check Fee Estimate (Stub) ---
export const CheckFeeEstimateInputSchema = z.object({
    productId: z.string().describe("Product ID (e.g. BTC-USD)"),
    amount: z.string().describe("Amount to trade")
});
export type CheckFeeEstimateInput = z.infer<typeof CheckFeeEstimateInputSchema>;

// --- Tool 8: Get Deposit Address ---
export const GetDepositAddressInputSchema = z.object({
    currency: z.string().describe("Currency Code (e.g. BTC, ETH)")
});
export type GetDepositAddressInput = z.infer<typeof GetDepositAddressInputSchema>;

// --- Tool 9: Get Product Book ---
export const GetProductBookInputSchema = z.object({
    productId: z.string().describe("Product ID (e.g. BTC-USD)")
});
export type GetProductBookInput = z.infer<typeof GetProductBookInputSchema>;

// --- Tool 10: List Products ---
export const ListProductsInputSchema = z.object({
    limit: z.number().optional()
});

// --- Tool 11: Cancel Order ---
export const CancelOrderInputSchema = z.object({
    orderIds: z.array(z.string()).describe("List of Order IDs to cancel")
});


