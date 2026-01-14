import { DaemoFunction } from 'daemo-engine';
import { stripe } from '../config';
import Stripe from 'stripe';
import * as Schemas from './stripe.schemas';

export class StripeFunctions {

    @DaemoFunction({
        description: "Calculate total revenue volume and transaction count between two inclusive dates. Use this to explain revenue trends.",
        tags: ["revenue", "finance", "payments"],
        category: "Finance",
        inputSchema: Schemas.FinancialMetricsInputSchema as any,
        outputSchema: Schemas.FinancialMetricsOutputSchema as any
    })
    public async getFinancialMetrics(input: { start_date: string, end_date: string }) {
        console.log(`[StripeFunctions] getFinancialMetrics: ${input.start_date} to ${input.end_date}`);

        const startTimestamp = Math.floor(new Date(input.start_date).getTime() / 1000);
        const endTimestamp = Math.floor(new Date(input.end_date).getTime() / 1000);

        let hasMore = true;
        let startingAfter: string | undefined = undefined;
        let totalAmount = 0;
        let totalFee = 0;
        let count = 0;

        while (hasMore) {
            const params: Stripe.BalanceTransactionListParams = {
                created: { gte: startTimestamp, lte: endTimestamp },
                type: 'charge',
                limit: 100,
            };

            if (startingAfter) {
                params.starting_after = startingAfter;
            }

            const transactions = await stripe.balanceTransactions.list(params);

            for (const txn of transactions.data) {
                totalAmount += txn.amount;
                totalFee += txn.fee;
                count++;
            }

            hasMore = transactions.has_more;
            if (hasMore && transactions.data.length > 0) {
                startingAfter = transactions.data[transactions.data.length - 1].id;
            }
        }

        return {
            start_date: input.start_date,
            end_date: input.end_date,
            total_volume: totalAmount / 100,
            total_fees: totalFee / 100,
            net_revenue: (totalAmount - totalFee) / 100,
            transaction_count: count,
            currency: 'usd'
        };
    }

    @DaemoFunction({
        description: "Search for failed payments by customer email to assist with support inquiries. Returns details of recent failures.",
        tags: ["support", "investigation", "failures"],
        category: "Support",
        inputSchema: Schemas.PaymentFailureInputSchema as any,
        outputSchema: Schemas.PaymentFailureOutputSchema as any
    })
    public async investigatePaymentFailure(input: { customer_email: string }) {
        console.log(`[StripeFunctions] investigatePaymentFailure: ${input.customer_email}`);

        // 1. Resolve Customer by Email
        const customerSearch = await stripe.customers.search({
            query: `email:"${input.customer_email}"`,
            limit: 1,
        });

        if (customerSearch.data.length === 0) {
            console.log("Customer not found. Returning empty results.");
            return {
                request_id: customerSearch.lastResponse.requestId,
                found_count: 0,
                failures: []
            };
        }

        const customerId = customerSearch.data[0].id;

        // 2. Search Charges by Customer and Status
        const query = `customer:"${customerId}" AND status:"failed"`;

        const searchResult = await stripe.charges.search({
            query: query,
            limit: 10,
        });

        return {
            request_id: searchResult.lastResponse.requestId,
            found_count: searchResult.data.length,
            failures: searchResult.data.map(c => ({
                id: c.id,
                amount: c.amount,
                created: c.created,
                failure_message: c.failure_message,
                failure_code: c.failure_code,
                status: c.status
            }))
        };
    }

    @DaemoFunction({
        description: "Issue a full refund to a customer for a specific charge. REQUIRES HUMAN CONFIRMATION.",
        tags: ["refunds", "transactions", "sensitive"],
        category: "Finance",
        inputSchema: Schemas.SecureRefundInputSchema as any,
        outputSchema: Schemas.SecureRefundOutputSchema as any
    })
    public async executeSecureRefund(input: { charge_id: string, reason: Stripe.RefundCreateParams.Reason }) {
        console.log(`[StripeFunctions] executeSecureRefund: ${input.charge_id} (${input.reason})`);

        try {
            const idempotencyKey = `refund_${input.charge_id}_${new Date().toISOString().split('T')[0]}`;

            const refund = await stripe.refunds.create({
                charge: input.charge_id,
                reason: input.reason,
            }, {
                idempotencyKey: idempotencyKey
            });

            return {
                success: true,
                refund_id: refund.id,
                status: refund.status,
                amount_refunded: refund.amount,
                currency: refund.currency,
                original_charge: input.charge_id
            };

        } catch (err: any) {
            if (err.type === 'StripeInvalidRequestError' && err.message.includes('already been refunded')) {
                return {
                    success: false,
                    error: "CHARGE_ALREADY_REFUNDED",
                    message: "This charge has already been refunded."
                };
            }
            throw err;
        }
    }
}
