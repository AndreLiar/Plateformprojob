
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY; // Expects NEXT_STRIPE_SECRET_KEY
const SERVER_STRIPE_SECRET_KEY = rawSecretKey?.trim(); // Internal to this module for server-side checks
console.log(`[Stripe Config] NEXT_STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!SERVER_STRIPE_SECRET_KEY}' (Server-side only)`);

// Stripe Price ID for the "Job Post" product - now read from NEXT_PUBLIC_STRIPE_PRICE_PREMIUM
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PRICE_PREMIUM (for Job Post Price ID): RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim(); // Server-side use, but can be logged
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}' (Server-side only)`);

// This flag indicates if CORE client-side Stripe.js initialization is possible.
// This is what JobPostForm.tsx uses to enable the purchase button initially.
export const canInitializeStripeJs = !!STRIPE_PUBLISHABLE_KEY;
console.log(`[Stripe Config] canInitializeStripeJs (client-side check based on Publishable Key) evaluated to: ${canInitializeStripeJs}`);


// Server-side check for API readiness (secret key is essential for API calls)
const stripeServerApiKeysPresent =
  !!SERVER_STRIPE_SECRET_KEY;
console.log(`[Stripe Config] Server API Core Keys Check (Secret Key): ${stripeServerApiKeysPresent ? 'Present' : 'INCOMPLETE'}`);

if (!stripeServerApiKeysPresent) {
  const missingKeys: string[] = [];
  if (!SERVER_STRIPE_SECRET_KEY) missingKeys.push("NEXT_STRIPE_SECRET_KEY (trimmed value is missing/empty)");
  console.warn(`[Stripe Config] SERVER-SIDE Stripe API calls may fail. Missing core server keys: [${missingKeys.join(', ')}]. Ensure these are set in .env.local and server is restarted.`);
}

// Specific warnings for full functionality
if (!STRIPE_JOB_POST_PRICE_ID) { // This now checks the public var, which is fine for logging
    console.warn("[Stripe Config] IMPORTANT FOR PURCHASE COMPLETION: 'NEXT_PUBLIC_STRIPE_PRICE_PREMIUM' (provides Job Post Price ID) is missing or empty. Users will NOT be able to complete purchases for job posts. Please ensure it's set in .env.local and restart the server.");
}
if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] IMPORTANT FOR POST-PURCHASE PROCESSING: 'STRIPE_WEBHOOK_SECRET' is missing or empty. Payment confirmation and post crediting via webhooks will fail. Please set this in .env.local and restart the server.");
}

const allStripeVarsPresentForFullFunctionality =
    !!STRIPE_PUBLISHABLE_KEY &&    // Client needs this
    !!SERVER_STRIPE_SECRET_KEY &&  // Server needs this
    !!STRIPE_WEBHOOK_SECRET &&     // Server needs this
    !!STRIPE_JOB_POST_PRICE_ID;    // Client needs to send this, Server uses it

if (!allStripeVarsPresentForFullFunctionality) {
    console.warn("[Stripe Config] === For FULL Stripe functionality (purchase AND crediting posts), please ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_STRIPE_PRICE_PREMIUM are set in your .env.local file and RESTART the Next.js server. ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables for full functionality appear to be present and trimmed correctly based on server-side checks.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");
