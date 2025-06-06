
// src/lib/stripeConfig.ts

// --- 1. Read Environment Variables ---
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY;
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Server-side only

// --- 2. Define and Export Constants ---
// Exported for client-side use (e.g., loading Stripe.js)
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();

// Exported for server-side use (e.g., API routes)
// This is the crucial export for the current error
export const STRIPE_SECRET_KEY = rawSecretKey?.trim();

// Exported for client-side (to send to backend) and server-side (to verify)
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();

// Exported for server-side webhook verification
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();


// --- 3. Perform Logging (Server-Side Only, during module load) ---
if (typeof window === 'undefined') {
  console.log("--- Stripe Configuration Check (Server-Side Module Load) ---");

  console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', ExportedTrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (exported trimmed)"}'`);
  console.log(`[Stripe Config] NEXT_STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', ExportedTrimmedValue='${STRIPE_SECRET_KEY || "Not set (exported trimmed)"}'`);
  console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PRICE_PREMIUM (for Job Post Price ID): RawValue='${rawJobPostPriceId || "Not set (raw)"}', ExportedTrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (exported trimmed)"}'`);
  console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', ExportedTrimmedValue='${STRIPE_WEBHOOK_SECRET || "Not set (exported trimmed)"}'`);

  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("[Stripe Config] CRITICAL CLIENT-SIDE IMPACT: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' is missing or empty. Stripe.js cannot load on the client.");
  }
  if (!STRIPE_SECRET_KEY) {
    console.warn(`[Stripe Config] CRITICAL SERVER-SIDE: Stripe API calls will fail. 'NEXT_STRIPE_SECRET_KEY' is missing or empty. Please set this and restart the server.`);
  }
  if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn(`[Stripe Config] CRITICAL CLIENT & SERVER-SIDE: Job post purchases will fail. 'NEXT_PUBLIC_STRIPE_PRICE_PREMIUM' (for Job Post Price ID) is missing or empty. Please set this and restart the server.`);
  }
  if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("[Stripe Config] IMPORTANT FOR POST-PURCHASE PROCESSING: 'STRIPE_WEBHOOK_SECRET' (server-side only) is missing or empty. Payment confirmation and post crediting via webhooks will fail.");
  }
  console.log("--- End Stripe Configuration Check (Server-Side Module Load) ---");
}

// Client-side convenience flags (these will be evaluated in the browser)
export const clientSideStripePublishableKeyPresent = !!STRIPE_PUBLISHABLE_KEY;
export const clientSideStripePriceIdPresent = !!STRIPE_JOB_POST_PRICE_ID;
