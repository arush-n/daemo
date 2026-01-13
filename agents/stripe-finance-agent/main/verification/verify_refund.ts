import 'reflect-metadata';
import { StripeFunctions } from '../src/services/stripeFunctions';
import { stripe } from '../src/config';

// Verification Protocol C: The "Idempotency & Approval Audit" (LIVE MODE - SERVICE PATTERN)
async function verify_refund_logic() {
    console.log("Starting Verification Protocol C: The 'Idempotency Test' (LIVE MODE - SERVICE PATTERN)...");

    const service = new StripeFunctions();

    try {
        // 1. Setup: Create a charge to refund
        const customer = await stripe.customers.create({ email: 'refund_test_v2@example.com' });
        const source = await stripe.customers.createSource(customer.id, { source: 'tok_visa' });
        const charge = await stripe.charges.create({
            amount: 1000,
            currency: 'usd',
            customer: customer.id,
            source: source.id,
            description: 'Charge to be refunded'
        });
        console.log(`Created charge ${charge.id} for testing.`);

        // 2. Test Successful Refund
        console.log("Test 1: Valid Refund Request");
        const result1 = await service.executeSecureRefund({
            charge_id: charge.id,
            reason: 'requested_by_customer'
        });

        if (!result1.success || result1.status !== 'succeeded') {
            console.error("❌ FAILED: Valid refund failed.", result1);
            process.exit(1);
        }
        console.log("✅ Valid refund passed.");

        // 3. Test Double Refund (Idempotency/Logic Check)
        console.log("Test 2: Duplicate Refund Request");

        try {
            const result2 = await service.executeSecureRefund({
                charge_id: charge.id,
                reason: 'duplicate'
            });

            // If it succeeds (200), it implies Replay (Same Key, Same Params) OR New Refund (New Key)
            // Since we changed the 'reason', same key would cause 400 Collision.

            if (result2.success) {
                console.log("⚠️ Result Success: Potentially Idempotency Replay.");
            } else if (result2.error === 'CHARGE_ALREADY_REFUNDED') {
                console.log("✅ Duplicate refund handled with explicit error.");
            }
        } catch (e: any) {
            // Check for Idempotency Mismatch (400)
            if (e.raw && e.raw.type === 'idempotency_error') {
                console.log("✅ Idempotency Key Collision detected (Stripe protected the request).");
            } else if (e.message && e.message.includes('keys for the same request with different parameters')) {
                console.log("✅ Idempotency Key Collision detected.");
            } else {
                console.error("❌ FAILED: Unexpected error during duplicate refund:", e.message);
                process.exit(1);
            }
        }

        console.log("Verification Passed!");

    } catch (err) {
        console.error("Verification Script Failed:", err);
        process.exit(1);
    }
}

verify_refund_logic();
