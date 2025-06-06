
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] Environment Variable for Publishable Key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY; // Expects NEXT_STRIPE_SECRET_KEY
export const STRIPE_SECRET_KEY = rawSecretKey?.trim(); // This is for server-side use, not directly exported for client
console.log(`[Stripe Config] Environment Variable for Secret Key: 'NEXT_STRIPE_SECRET_KEY', RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!STRIPE_SECRET_KEY}'`);

// Stripe Price ID for the "Job Post" product - read from STRIPE_PRICE_PREMIUM
const rawJobPostPriceId = process.env.STRIPE_PRICE_PREMIUM;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] Environment Variable for Job Post Price ID: 'STRIPE_PRICE_PREMIUM', RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim(); // Server-side use
console.log(`[Stripe Config] Environment Variable for Webhook Secret: 'STRIPE_WEBHOOK_SECRET', RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}'`);


// This flag indicates if core keys for SERVER-SIDE API calls are present.
// Useful for server-side logging or pre-checks if needed.
const stripeServerApiKeysPresent =
  !!STRIPE_PUBLISHABLE_KEY && // Publishable key is often needed by server too for session creation context
  !!STRIPE_SECRET_KEY;

console.log(`[Stripe Config] Server API Core Keys Check (Publishable & Secret): ${stripeServerApiKeysPresent ? 'Present' : 'INCOMPLETE'}`);

if (!stripeServerApiKeysPresent) {
  const missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (trimmed value is missing/empty)");
  if (!STRIPE_SECRET_KEY) missingKeys.push("NEXT_STRIPE_SECRET_KEY (trimmed value is missing/empty)");
  console.warn(`[Stripe Config] SERVER-SIDE Stripe API calls may fail. Missing core keys: [${missingKeys.join(', ')}]. Ensure these are set in .env.local and server is restarted.`);
}


// Specific warnings for full functionality
if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn("[Stripe Config] IMPORTANT FOR PURCHASE COMPLETION: 'STRIPE_PRICE_PREMIUM' (provides Job Post Price ID) is missing or empty. Users will NOT be able to complete purchases for job posts. Please set this in .env.local.");
}
if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] IMPORTANT FOR POST-PURCHASE PROCESSING: 'STRIPE_WEBHOOK_SECRET' is missing or empty. Payment confirmation and post crediting via webhooks will fail. Please set this in .env.local.");
}

const allStripeVarsPresentForFullFunctionality =
    !!STRIPE_PUBLISHABLE_KEY &&
    !!STRIPE_SECRET_KEY &&
    !!STRIPE_WEBHOOK_SECRET &&
    !!STRIPE_JOB_POST_PRICE_ID;

if (!allStripeVarsPresentForFullFunctionality) {
    console.warn("[Stripe Config] === For FULL Stripe functionality (purchase AND crediting posts), please ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_PREMIUM are set in your .env.local file and RESTART the Next.js server. ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables for full functionality appear to be present and trimmed correctly based on server-side checks.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");

// Note: `stripeSuccessfullyInitialized` is removed as a broad client-side check.
// Client components should check for specific NEXT_PUBLIC_ keys they need.
