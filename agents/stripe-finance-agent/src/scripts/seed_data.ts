import { stripe } from '../src/config';

async function seedData() {
    console.log("--> Starting Seeding Process...");

    try {
        // 1. Create Customer
        console.log("Step 1: Creating Customer...");
        const customer = await stripe.customers.create({
            email: 'alice_verified@example.com',
            name: 'Alice Verified',
            description: 'Test Customer for Feature A & B',
        });
        console.log(`--> Created Customer: ${customer.id}`);

        // 2. Success Charge 1
        console.log("Step 2: Creating Charge 1 ($50)...");
        try {
            // Attach source to customer first
            const card1 = await stripe.customers.createSource(customer.id, {
                source: 'tok_visa'
            });

            await stripe.charges.create({
                amount: 5000,
                currency: 'usd',
                source: card1.id,
                description: 'Service Fee - Q3',
                customer: customer.id,
            });
            console.log("--> Charge 1 Success");
        } catch (e: any) {
            console.error(`--> Charge 1 FAILED: ${e.message}`);
            throw e;
        }

        // 3. Success Charge 2
        console.log("Step 3: Creating Charge 2 ($25)...");
        try {
            const card2 = await stripe.customers.createSource(customer.id, {
                source: 'tok_mastercard'
            });

            await stripe.charges.create({
                amount: 2500,
                currency: 'usd',
                source: card2.id,
                description: 'Product Purchase',
                customer: customer.id,
            });
            console.log("--> Charge 2 Success");
        } catch (e: any) {
            console.error(`--> Charge 2 FAILED: ${e.message}`);
            throw e;
        }

        // 4. Failed Charge
        console.log("Step 4: Creating Failed Charge (Expected Failure)...");
        try {
            await stripe.charges.create({
                amount: 9999,
                currency: 'usd',
                source: 'tok_chargeDeclined',
                description: 'Failed Subscription',
                customer: customer.id,
            });
            console.error("--> ERROR: Failed charge Unexpectedly SUCCEEDED!");
        } catch (e: any) {
            console.log(`--> Caught Expected Error: ${e.message}`);
            // Do not rethrow
        }

        console.log("✅ Seeding Complete!");

    } catch (err: any) {
        console.error("\n❌ CRITICAL SEEDING FAILURE ❌");
        console.error(`Error Type: ${err.type}`);
        console.error(`Error Code: ${err.raw ? err.raw.code : 'N/A'}`);
        console.error(`Message: ${err.message}`);
        process.exit(1);
    }
}

seedData();
