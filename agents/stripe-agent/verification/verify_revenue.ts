import 'reflect-metadata';
import { StripeFunctions } from '../src/services/stripeFunctions';
import { stripe } from '../src/config';

async function verify_revenue_logic() {
    console.log("Starting Verification Protocol A: The 'CURL Comparator' (LIVE MODE - SERVICE PATTERN)...");

    const service = new StripeFunctions();

    // 1. Define verification range (Last 7 days approx)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    console.log(`Test Range: ${startIso} to ${endIso}`);

    // 2. Call the Tool (Via Service Method)
    console.log("Calling Service Method: getFinancialMetrics...");
    const agentResult = await service.getFinancialMetrics({
        start_date: startIso,
        end_date: endIso
    });
    console.log("Agent Result:", JSON.stringify(agentResult, null, 2));

    // 3. Run the Control Check (Manual Query)
    console.log("Running Control Query (Manual implementation)...");

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    let controlTotalAmount = 0;
    let controlTotalFee = 0;
    let controlCount = 0;

    // Manual iteration
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
        const params: any = {
            created: { gte: startTimestamp, lte: endTimestamp },
            type: 'charge',
            limit: 100,
        };
        if (startingAfter) params.starting_after = startingAfter;

        const txns = await stripe.balanceTransactions.list(params);

        for (const txn of txns.data) {
            controlTotalAmount += txn.amount;
            controlTotalFee += txn.fee;
            controlCount++;
        }

        hasMore = txns.has_more;
        if (hasMore && txns.data.length > 0) {
            startingAfter = txns.data[txns.data.length - 1].id;
        }
    }

    const controlVolume = controlTotalAmount / 100;
    const controlFees = controlTotalFee / 100;

    console.log("Control Result:");
    console.log(`Count: ${controlCount}`);
    console.log(`Sum of Amount (from API): ${controlVolume}`);
    console.log(`Sum of Fee (from API): ${controlFees}`);

    // 4. Compare
    console.log("\n--- COMPARISON ---");

    if (agentResult.transaction_count !== controlCount) {
        console.error(`❌ FAILED: Count mismatch. Agent: ${agentResult.transaction_count}, Control: ${controlCount}`);
        process.exit(1);
    } else {
        console.log("✅ Count match");
    }

    if (agentResult.total_volume !== controlVolume) {
        console.error(`❌ FAILED: Volume mismatch. Agent: ${agentResult.total_volume}, Control: ${controlVolume}`);
        process.exit(1);
    } else {
        console.log("✅ Volume match");
    }

    console.log("Verification Passed!");
}

verify_revenue_logic().catch(err => {
    console.error("Verification Script Failed:", err);
    process.exit(1);
});
