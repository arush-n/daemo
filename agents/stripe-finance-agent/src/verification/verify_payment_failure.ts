import 'reflect-metadata';
import { StripeFunctions } from '../src/services/stripeFunctions';

// Verification Protocol B: The "Negative Test"
async function verify_payment_failure() {
    console.log("Starting Verification Protocol B: The 'Negative Test' (LIVE MODE - SERVICE PATTERN)...");

    const service = new StripeFunctions();
    const ghostEmail = "user_ghost_404@test.com"; // Ensure this user does not exist or has no failures

    console.log(`Testing with Ghost Email: ${ghostEmail}`);

    try {
        const result = await service.investigatePaymentFailure({ customer_email: ghostEmail });

        console.log("Tool Result:", JSON.stringify(result, null, 2));

        // Expected: found_count === 0, failures: []
        if (result.found_count !== 0) {
            console.error(`❌ FAILED: Expected 0 failures for ghost user, found ${result.found_count}`);
            process.exit(1);
        }

        if (result.failures.length !== 0) {
            console.error(`❌ FAILED: Failures array is not empty.`);
            process.exit(1);
        }

        console.log("✅ Ghost User check passed (No hallucinations).");
        console.log("Verification Passed!");

    } catch (err) {
        console.error("Verification Script Threw Error:", err);
        process.exit(1);
    }
}

verify_payment_failure();
