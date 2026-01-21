import { z } from 'zod';

// --- FEATURE A: Revenue Intelligence ---

export const FinancialMetricsInputSchema = z.object({
    start_date: z.string().describe("The start date as a simple string in 'YYYY-MM-DD' format (e.g. '2023-01-01'). Do NOT pass an object."),
    end_date: z.string().describe("The end date as a simple string in 'YYYY-MM-DD' format (e.g. '2023-01-31'). Do NOT pass an object."),
});

export const FinancialMetricsOutputSchema = z.object({
    start_date: z.string(),
    end_date: z.string(),
    total_volume: z.number().describe("Total revenue in dollars"),
    total_fees: z.number().describe("Total Stripe fees in dollars"),
    net_revenue: z.number().describe("Net revenue (volume - fees) in dollars"),
    transaction_count: z.number().describe("Total number of successful charges"),
    currency: z.string()
});

// --- FEATURE B: Support Operations ---

export const PaymentFailureInputSchema = z.object({
    customer_email: z.string().email().describe("The email address of the customer to investigate. Pass as a simple string.")
});

export const PaymentFailureOutputSchema = z.object({
    found_count: z.number().describe("Number of failed charges found"),
    failures: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        failure_message: z.string().optional(),
        failure_code: z.string().optional(),
        status: z.string()
    })),
    refunds: z.array(z.object({
        id: z.string(),
        amount: z.number(),
        status: z.string().optional(),
        charge_id: z.string().optional()
    })).describe("List of recent refunds found for this customer")
});

// --- FEATURE C: Secure Refunds ---

export const SecureRefundInputSchema = z.object({
    charge_id: z.string().describe("The Stripe Charge ID (e.g., ch_123) to refund. Pass as a simple string."),
    reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer']).describe("The internal reason for the refund"),
});

export const SecureRefundOutputSchema = z.object({
    success: z.boolean(),
    refund_id: z.string().optional(),
    status: z.string().optional().describe("succeeded, pending, or failed"),
    error: z.string().optional()
});
