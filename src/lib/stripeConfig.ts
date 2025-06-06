
// src/lib/stripeConfig.ts

// --- 1. Read Environment Variables ---
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY; // Server-side only
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;

// --- 2. Define and Export Constants ---
export const STRIPE_PUBLISHABLE_KEY: string | undefined = rawPublishableKey?.trim();
export const STRIPE_SECRET_KEY: string | undefined = rawSecretKey?.trim(); // This is the crucial export
export const STRIPE_JOB_POST_PRICE_ID: string | undefined = rawJobPostPriceId?.trim();

// --- 3. Perform Logging (Server-Side Only, during module load) ---
if (typeof window === 'undefined') {
  console.log("--- Stripe Configuration Check (Server-Side Module Load) ---");

  // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  console.log(`[Stripe Config] Env Var: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`);
  console.log(`  Raw Value: '${rawPublishableKey === undefined ? "undefined (raw)" : (rawPublishableKey === null ? "null (raw)" : `"${rawPublishableKey}"`)}'`);
  console.log(`  Exported as STRIPE_PUBLISHABLE_KEY (trimmed): '${STRIPE_PUBLISHABLE_KEY === undefined ? "undefined (exported)" : (STRIPE_PUBLISHABLE_KEY === null ? "null (exported)" : `"${STRIPE_PUBLISHABLE_KEY}"`)}'`);
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn("  WARNING: STRIPE_PUBLISHABLE_KEY is missing or empty. Stripe.js cannot load on the client.");
  }

  // NEXT_STRIPE_SECRET_KEY
  console.log(`[Stripe Config] Env Var: NEXT_STRIPE_SECRET_KEY`);
  console.log(`  Raw Value: '${rawSecretKey === undefined ? "undefined (raw)" : (rawSecretKey === null ? "null (raw)" : `"${rawSecretKey}"`)}'`);
  console.log(`  Exported as STRIPE_SECRET_KEY (trimmed): '${STRIPE_SECRET_KEY === undefined ? "undefined (exported)" : (STRIPE_SECRET_KEY === null ? "null (exported)" : `"${STRIPE_SECRET_KEY}"`)}'`);
  if (!STRIPE_SECRET_KEY) {
    console.error("  CRITICAL ERROR: STRIPE_SECRET_KEY is missing or empty after reading NEXT_STRIPE_SECRET_KEY. Stripe API calls will fail on the server. Ensure NEXT_STRIPE_SECRET_KEY is set in your .env.local or server environment.");
  } else {
    console.log("  SUCCESS: STRIPE_SECRET_KEY is set and will be exported.");
  }

  // NEXT_PUBLIC_STRIPE_PRICE_PREMIUM
  console.log(`[Stripe Config] Env Var: NEXT_PUBLIC_STRIPE_PRICE_PREMIUM`);
  console.log(`  Raw Value: '${rawJobPostPriceId === undefined ? "undefined (raw)" : (rawJobPostPriceId === null ? "null (raw)" : `"${rawJobPostPriceId}"`)}'`);
  console.log(`  Exported as STRIPE_JOB_POST_PRICE_ID (trimmed): '${STRIPE_JOB_POST_PRICE_ID === undefined ? "undefined (exported)" : (STRIPE_JOB_POST_PRICE_ID === null ? "null (exported)" : `"${STRIPE_JOB_POST_PRICE_ID}"`)}'`);
  if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn("  WARNING: STRIPE_JOB_POST_PRICE_ID is missing or empty. Job post purchases will fail.");
  }
  console.log("--- End Stripe Configuration Check (Server-Side Module Load) ---");
}

// Client-side convenience flags (these will be evaluated in the browser)
export const clientSideStripePublishableKeyPresent = !!STRIPE_PUBLISHABLE_KEY;
export const clientSideStripePriceIdPresent = !!STRIPE_JOB_POST_PRICE_ID;
