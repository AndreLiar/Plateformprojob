
// src/lib/stripeConfig.ts

// --- 1. Read Environment Variables ---
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY; // Server-side only
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Server-side only

// --- 2. Define and Export Constants ---
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
export const STRIPE_SECRET_KEY = rawSecretKey?.trim(); // THIS IS THE CRUCIAL EXPORT
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();

// --- 3. Perform Logging (Server-Side Only, during module load) ---
if (typeof window === 'undefined') {
  console.log("--- Stripe Configuration Check (Server-Side Module Load) ---");

  console.log(`[Stripe Config] Env Var: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`);
  console.log(`  Raw Value: '${rawPublishableKey || "Not set (raw)"}'`);
  console.log(`  Exported as STRIPE_PUBLISHABLE_KEY (trimmed): '${STRIPE_PUBLISHABLE_KEY || "Not set (exported trimmed)"}'`);
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("  WARNING: STRIPE_PUBLISHABLE_KEY is missing or empty. Stripe.js cannot load on the client.");
  }

  console.log(`[Stripe Config] Env Var: NEXT_STRIPE_SECRET_KEY`);
  console.log(`  Raw Value (Existence Check): ${rawSecretKey !== undefined ? (rawSecretKey === '' ? 'Exists but EMPTY' : 'Exists and has content') : 'Does NOT exist (undefined)'}`);
  console.log(`  Exported as STRIPE_SECRET_KEY (trimmed): '${STRIPE_SECRET_KEY || "Not set (exported trimmed)"}'`);
  if (!STRIPE_SECRET_KEY) {
    console.warn("  CRITICAL: STRIPE_SECRET_KEY is missing or empty. Stripe API calls will fail on the server.");
  }

  console.log(`[Stripe Config] Env Var: NEXT_PUBLIC_STRIPE_PRICE_PREMIUM`);
  console.log(`  Raw Value: '${rawJobPostPriceId || "Not set (raw)"}'`);
  console.log(`  Exported as STRIPE_JOB_POST_PRICE_ID (trimmed): '${STRIPE_JOB_POST_PRICE_ID || "Not set (exported trimmed)"}'`);
  if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn("  WARNING: STRIPE_JOB_POST_PRICE_ID is missing or empty. Job post purchases will fail.");
  }

  console.log(`[Stripe Config] Env Var: STRIPE_WEBHOOK_SECRET`);
  console.log(`  Raw Value (Existence Check): ${rawWebhookSecret !== undefined ? (rawWebhookSecret === '' ? 'Exists but EMPTY' : 'Exists and has content') : 'Does NOT exist (undefined)'}`);
  console.log(`  Exported as STRIPE_WEBHOOK_SECRET (trimmed): '${STRIPE_WEBHOOK_SECRET || "Not set (exported trimmed)"}'`);
  if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("  INFO: STRIPE_WEBHOOK_SECRET is missing or empty. Webhook processing will fail (relevant for post-purchase crediting).");
  }
  console.log("--- End Stripe Configuration Check (Server-Side Module Load) ---");
}

// Client-side convenience flags (these will be evaluated in the browser)
export const clientSideStripePublishableKeyPresent = !!STRIPE_PUBLISHABLE_KEY;
export const clientSideStripePriceIdPresent = !!STRIPE_JOB_POST_PRICE_ID;
