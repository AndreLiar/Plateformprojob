
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
const rawSecretKey = process.env.STRIPE_SECRET_KEY;
export const STRIPE_SECRET_KEY = rawSecretKey?.trim();
console.log(`[Stripe Config] STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!STRIPE_SECRET_KEY}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server) - Still needed for full functionality
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}' (Required for webhook processing)`);

// Stripe Price ID for the "Job Post" product - Still needed for initiating purchases
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID: RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}' (Required for creating checkout sessions)`);

// A boolean to check if basic Stripe client-side/API interaction can be initialized
// The purchase button will be enabled if these two are present.
// Full functionality (checkout & webhook processing) requires all four keys.
export const stripeSuccessfullyInitialized =
  !!STRIPE_PUBLISHABLE_KEY &&
  !!STRIPE_SECRET_KEY;

console.log(`[Stripe Config] stripeSuccessfullyInitialized (based on Publishable and Secret keys only) evaluated to: ${stripeSuccessfullyInitialized}`);

if (!stripeSuccessfullyInitialized) {
  const missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (is empty or missing after trim)");
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY (is empty or missing after trim)");
  
  const message = `[Stripe Config] Basic Stripe configuration is INCOMPLETE. One or more required environment variables for core functionality are missing, empty, or consist only of whitespace: [${missingKeys.join(', ')}]. Stripe purchase button will be disabled.`;
  console.warn(message);
} else {
  console.log("[Stripe Config] Basic Stripe configuration (Publishable and Secret keys) appears COMPLETE.");
  if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn("[Stripe Config] WARNING: NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID is missing. Users will not be able to complete purchases.");
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] WARNING: STRIPE_WEBHOOK_SECRET is missing. Payment confirmation and post crediting via webhooks will fail.");
  }
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID) {
    console.warn("[Stripe Config] === PLEASE VERIFY your .env.local file and RESTART the Next.js server if any Stripe keys are reported missing or if functionality is not as expected. ===");
    console.warn("[Stripe Config] Check that the variable names are EXACTLY correct and that they have non-empty values.");
    console.warn("[Stripe Config] Values Next.js is seeing from process.env (raw, before trim):");
    console.warn(`  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (raw): ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'NOT FOUND IN process.env'}`);
    console.warn(`  - STRIPE_SECRET_KEY (raw): ${process.env.STRIPE_SECRET_KEY ? 'FOUND (value hidden for security)' : 'NOT FOUND IN process.env'}`);
    console.warn(`  - STRIPE_WEBHOOK_SECRET (raw): ${process.env.STRIPE_WEBHOOK_SECRET ? 'FOUND (value hidden for security)' : 'NOT FOUND IN process.env'}`);
    console.warn(`  - NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID (raw): ${process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID || 'NOT FOUND IN process.env'}`);
    console.warn("[Stripe Config] === End of diagnostic printout ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables appear to be present in process.env.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");

// Client-side warning (less critical if server-side is fine, but good for completeness)
if (typeof window !== 'undefined') { // Running on the client
    if (!STRIPE_PUBLISHABLE_KEY) {
      // console.warn("[Stripe Config Client] Client-side check: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY might be missing or empty. This could affect Stripe.js initialization if server-side checks also failed.");
    }
}
