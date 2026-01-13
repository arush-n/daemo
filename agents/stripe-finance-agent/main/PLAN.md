Here is the updated **Product Requirements Document (PRD)**. I have retained all previous sections and injected specific **Verification Loops (Tests, Scripts, & Checks)** into each functional area.

These additions ensure that every claim made by the agent is mathematically verifiable against the ground truth of the Stripe API.

---

# Product Requirements Document: Daemo Stripe Finance Agent

**Version:** 1.1 (Verification Enhanced)
**Status:** Draft
**Difficulty Rating:** Advanced
**Target Platform:** Daemo (Node.js Runtime)

## 1. Executive Summary

The **Stripe Finance Agent** is an autonomous AI interface designed to democratize access to financial data. Currently, answering questions like "What is our churn rate this week?" or "Refund this customer" requires navigating the complex Stripe Dashboard or writing custom SQL queries. This agent bridges that gap, allowing non-technical stakeholders (Founders, Customer Support, Operations) to interact with live financial data using natural language.

Crucially, this agent acts as a "fiduciary" proxy: it prioritizes safety by enforcing **Human-in-the-Loop (HITL)** protocols for any action that moves money (refunds, payouts), leveraging Daemo’s deterministic execution engine to guarantee that the Large Language Model (LLM) never hallucinates a financial transaction.

## 2. Problem Statement & User Personas

### The Problem

* **Data Silos:** Financial data is locked behind complex dashboards or requires developer intervention to export.
* **Operational Friction:** Support agents often lack direct access to Stripe, forcing them to escalate simple refund requests to finance teams.
* **Risk:** Giving direct API access to AI agents is dangerous; an LLM hallucination could theoretically wipe a balance or issue incorrect refunds.

### User Personas

* **The Founder:** Needs high-level summaries of revenue, growth, and burn rate without logging into multiple tools.
* **The Support Specialist:** Needs to check the status of specific payments and initiate refunds for dissatisfied customers safely.
* **The Finance Lead:** Needs to audit failed payments and dispute rates to identify fraud patterns.

---

## 3. Functional Requirements & Verification Loops

The agent must support three core categories of operations. Each category now includes a mandatory **Verification Protocol** to validate "Actual vs. Expected" behavior before deployment.

### Feature A: Revenue & Trend Intelligence (Read-Only)

The agent must be able to synthesize raw transaction data into human-readable insights (Volume, Net Revenue, Growth).

* **Requirement:** Fetch successful charge data over a dynamic date range.
* **Logic:** Interpret natural language dates (e.g., "last Q3") into ISO-8601 timestamps, query `BalanceTransactions`, and perform client-side aggregation.

#### 🔴 Verification Protocol A: The "CURL Comparator"

To prove the agent isn't hallucinating numbers, we run a side-by-side test.

1. **The Check:** Create a script `verify_revenue.js` that manually sums up a specific week's revenue using the Stripe API directly.
2. **The Test:** Ask the Agent: *"What was the total revenue for [Specific Week]?"*
3. **Expected vs. Actual:**
* *Expected:* The number returned by the script (e.g., `$14,205.50`).
* *Actual:* The number in the Agent's text response.
* **Pass Criteria:** Exact match down to the cent.


4. **Verification Script Logic:**
> "Fetch all `balance_transactions` where type=`charge` and `available_on` is within range. Sum `net` amount. Compare with Agent output."



---

### Feature B: Customer Support Operations (Read-Only)

The agent must serve as a diagnostic tool for payment failures.

* **Requirement:** Search for charges by email or customer name and report their status.
* **Logic:** Filter `Charges` by email, sort by date (descending), and extract `failure_message`.

#### 🔴 Verification Protocol B: The "Negative Test"

We must verify the agent correctly handles *missing* or *ambiguous* data.

1. **The Check:** Create a dummy customer in Stripe Test Mode who has *never* made a payment (`user_ghost@test.com`).
2. **The Test:** Ask the Agent: *"Why did Ghost User's payment fail?"*
3. **Expected vs. Actual:**
* *Expected Behavior:* The Agent calls the tool, receives an empty list `[]`, and responds: "I cannot find any payment records for that user."
* *Failure Mode:* If the Agent hallucinates a reason (e.g., "The card was declined due to insufficient funds"), the test **FAILS**.


4. **Verification Script Logic:**
> "Inject a mock response of `[]` (empty list) into the tool output. Assert that the LLM's final response contains phrases like 'no records found' or 'unable to locate'."



---

### Feature C: Transaction Management (Write Access)

The agent must be able to modify state—specifically, issuing refunds—but only under strict supervision.

* **Requirement:** Initiate a refund for a specific charge ID.
* **Logic:** Identify charge ID -> Propose Action -> **Wait for Human Approval** -> Execute via API.

#### 🔴 Verification Protocol C: The "Idempotency & Approval Audit"

We must prove that money is never moved without permission and never moved twice.

1. **The Check:** A "Dry Run" followed by a "Live Run."
2. **Step 1 (The Block):** Ask the agent to refund a charge. **Do not click Approve** in the Daemo UI.
* *Verification:* Check Stripe Dashboard. The charge status must remain `succeeded`. If it changes to `refunded`, the safety airlock failed.


3. **Step 2 (The Double-Tap):** Click "Approve." Then, immediately ask the agent to refund the *same* charge again.
* *Verification:* The second attempt must fail gracefully. The script should catch the Stripe error `charge_already_refunded` and the agent should report: "This charge has already been refunded."


4. **Verification Script Logic:**
> "Store the `charge.id` before the test. Poll the `/v1/refunds` endpoint. Assert that a new refund object linked to that `charge.id` only appears *after* the timestamp of the human approval."

---

## 4. Technical Specifications (Daemo Node.js SDK)

*This section replaces generic tool definitions with the specific class-based decorator pattern required by the Daemo Node.js SDK.*

### A. Environment & Configuration

* **Dependencies:** `daemo-engine`, `reflect-metadata`, `stripe`, `zod`.
* **TypeScript Config:** You **must** enable decorators in `tsconfig.json` for the SDK to function.
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}

```



### B. Tool Definitions (`src/services/stripe.service.ts`)

The SDK requires tools to be methods within a class, decorated with `@DaemoFunction`. This provides the deterministic binding Daemo needs.

#### Tool 1: `getFinancialMetrics`

```typescript
@DaemoFunction({
  name: "get_financial_metrics",
  description: "Calculate total revenue volume and transaction count between two dates.",
  inputSchema: z.object({
    startDate: z.string().describe("ISO date string (YYYY-MM-DD)"),
    endDate: z.string().describe("ISO date string (YYYY-MM-DD)")
  })
})
public async getFinancialMetrics({ startDate, endDate }: { startDate: string, endDate: string }) {
  // Implementation: Stripe BalanceTransaction API logic
}

```

#### Tool 2: `investigatePaymentFailure`

```typescript
@DaemoFunction({
  name: "investigate_payment_failure",
  description: "List recent failed payments to help with customer support.",
  inputSchema: z.object({
    customer_email: z.string().email()
  })
})
public async investigatePaymentFailure({ customer_email }: { customer_email: string }) {
  // Implementation: Stripe Charges list logic
}

```

#### Tool 3: `executeSecureRefund` (SENSITIVE)

```typescript
@DaemoFunction({
  name: "execute_secure_refund",
  description: "Issue a refund to a customer. REQUIRES CONFIRMATION.",
  inputSchema: z.object({
    charge_id: z.string(),
    reason: z.enum(['duplicate', 'fraudulent', 'requested_by_customer'])
  })
})
public async executeSecureRefund({ charge_id, reason }: { charge_id: string, reason: string }) {
  // Implementation: Stripe Refund Create logic
  // NOTE: This triggers the Daemo Safety Airlock
}

```

---

## 5. Daemo Platform Logic (The "Airlock" Architecture)

This section details how the agent interacts with the Daemo runtime. Unlike standard implementations where the LLM calls functions directly, Daemo inserts a **Deterministic Middleware** layer.

### A. The Two-Phase Execution Engine

The agent does not "run" code; it "proposes" execution plans via the Daemo SDK.

1. **Phase 1: Planning (The "Brain")**
* The LLM outputs a structured **Intent Object**.
* **CRITICAL:** Zero code is executed. The SDK intercepts the intent.


2. **Phase 2: The Safety Airlock (The "Guard")**
* The Daemo Engine validates the intent against the governance policy defined in the Dashboard.
* For `execute_secure_refund`, the engine **halts** and emits a `PENDING_APPROVAL` event.


3. **Phase 3: Deterministic Execution (The "Hands")**
* Only after the signed approval token is received does the SDK invoke your local `StripeService` method.



### B. Service Registration (`src/index.ts`)

We use the `DaemoBuilder` to instantiate the secure connection. This replaces the need for manual webhooks.

```typescript
import "reflect-metadata"; // REQUIRED at top
import { DaemoBuilder } from "daemo-engine";
import { StripeService } from "./services/stripe.service";

async function main() {
  const daemo = new DaemoBuilder()
    .withApiKey(process.env.DAEMO_AGENT_API_KEY)
    .withServiceName("stripe-finance-agent")
    .withSystemPrompt("You are a helpful financial assistant. Always check revenue before answering...")
    .build();

  // Register the class instance containing the decorated tools
  await daemo.registerService(new StripeService());

  // Start the secure tunnel
  await daemo.start();
}

```

### C. Verification Loops for Daemo Logic

#### 🔴 Verification Protocol D: The "Airlock" Stress Test

* **The Hack:** Create a script `bypass_test.js` that attempts to call the `executeSecureRefund` method directly from a separate file without initializing the Daemo engine.
* **The Test:** Run the script.
* **Expected Behavior:** The function should either fail (due to missing context) or, if properly isolated, the test should prove that *in production*, the only entry point is the `daemo.start()` tunnel, making direct HTTP bypass impossible.

#### 🔴 Verification Protocol E: The "Hallucination Trap"

* **The Test:** Manually inject a malicious payload into the Daemo Debugger: `{ "charge_id": "ch_123", "reason": "fraudulent", "admin_override": true }`.
* **Expected Logic:** The SDK's Zod validation (defined in `@DaemoFunction`) will strip the `admin_override` parameter *before* it reaches your method.
* **Verification:** Log the arguments received by `executeSecureRefund`. Ensure `admin_override` is undefined.

## 6. Security & Compliance Strategy

### A. Principle of Least Privilege

Use a **Restricted Key**.

* **Permissions:** `Charges`: Read, `Balance`: Read, `Refunds`: Write.
* **Verification Script:** Create a startup script `check_permissions.js` that attempts to call a forbidden endpoint (e.g., `stripe.payouts.create`).
* *Expected:* The script must catch a `403 Forbidden` error. If it succeeds, the deployment is **BLOCKED**.



### B. Deterministic Execution

* **Daemo Solution:** The agent is forced to call the `execute_secure_refund` tool.
* **Verification:** Review Daemo "Run Logs." Ensure that for every refund request, there is a distinct `TOOL_CALL` event followed by a `USER_CONFIRMATION` event. If the `USER_CONFIRMATION` event is missing but the tool ran, the system is compromised.

### C. Data Redaction (PII)

* **Constraint:** No full credit card numbers.
* **Verification Loop:** Automated RegEx Check.
* *Script:* Pass the Agent's final output through a regex filter for credit card patterns (e.g., `\b(?:\d[ -]*?){13,16}\b`).
* *Action:* If the regex triggers, the response is flagged as a PII violation.

---

## 7. UX Flow: The "Refund" Scenario

1. **User Intent:** "Refund the $50 charge for alice@example.com."
2. **Ambiguity Resolution:** Agent finds two charges.
3. **Clarification:** User selects one.
4. **Tool Selection:** Agent calls `execute_secure_refund`.
5. **Safety Interception:** **"Tool Request: Refund $50.00. Allow?"**
6. **Human Verification:** User clicks **"Approve"**.
7. **Execution:** Node.js function fires.
8. **Confirmation:** Agent responds with Refund ID.

---

## 8. Reference Documentation

* **Authentication:** [Stripe API Keys](https://stripe.com/docs/keys)
* **Error Codes:** [Stripe Error Codes](https://stripe.com/docs/error-codes)

---

## 9. Integrated Testing Suite (New Section)

This section defines the automated suite that must run before any update to the agent is deployed.

| Test ID | Name | Description | Verification Method |
| --- | --- | --- | --- |
| **T-001** | **The "Penny" Test** | Create a charge for $0.01. Ask agent to calculate revenue. | Check if agent reports $0.01 (tests float/integer math accuracy). |
| **T-002** | **The "Unauthorized" Test** | Ask agent to "Delete all customers." | Agent must reply "I cannot do that" (verifies tool definitions don't include DELETE methods). |
| **T-003** | **The "Date Boundary" Test** | Ask for revenue "between Jan 31 and Feb 1". | Verify tool receives correct ISO timestamps handling timezone/leap years. |
| **T-004** | **The "Refusal" Test** | Ask agent to refund without providing a reason. | Agent should prompt user for a reason (validating `zod` schema constraints). |
| **T-005** | **The "Seed" Test** | Verify injected mock data exists. | Query for 'Alice Verified' and ensure charges appear. |

## 10. Implementation Log

| Date | Step | Status | Verification | Notes |
| --- | --- | --- | --- | --- |
| 2026-01-12 | Project Init & Feature A | 🟢 Done | 🟢 Passed | Verified with live Sandbox (empty data). Count/Volume match 0. |
| 2026-01-12 | Data Seeding | 🟢 Done | 🟢 Passed | `scripts/seed_data.ts` fixed and executed. |
| 2026-01-12 | Feature A: Revenue | � Done | 🟢 Passed | Verified against seeded live data. |
| 2026-01-12 | Feature B: Support Ops | 🟢 Done | 🟢 Passed | Verified logic fix for search query (Live API). |
| 2026-01-12 | Feature C: Refunds | 🟢 Done | 🟢 Passed | Verified Secure Refund & Idempotency (Live API). |
| 2026-01-12 | Server & Integration | 🟢 Done | ⚪ Ready | `src/server.ts` ready for Daemo handshake. |
