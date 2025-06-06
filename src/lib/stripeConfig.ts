
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
// This should NOT be prefixed with NEXT_PUBLIC_
// Reads from NEXT_STRIPE_SECRET_KEY as per previous user request
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY;
const serverSideSecretKey = rawSecretKey?.trim(); // Store the trimmed key
console.log(`[Stripe Config] NEXT_STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!serverSideSecretKey}' (Server-side only)`);

// Export the secret key for server-side use (e.g., API routes)
export const STRIPE_SECRET_KEY = serverSideSecretKey;

// Stripe Price ID for the "Job Post" product (e.g., 5 EUR per post)
// Must be prefixed with NEXT_PUBLIC_ if accessed client-side for checks or display
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PRICE_PREMIUM (for Job Post Price ID): RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);


// Stripe Webhook Secret (for verifying webhook signatures on the server)
// This should NOT be prefixed with NEXT_PUBLIC_
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim(); // Server-side use
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}' (Server-side only)`);


// This flag indicates if CORE client-side Stripe.js initialization is possible.
// It is based on the presence of the publishable key.
export const canInitializeStripeJs = !!STRIPE_PUBLISHABLE_KEY;
console.log(`[Stripe Config] canInitializeStripeJs (client-side check based on Publishable Key) evaluated to: ${canInitializeStripeJs}`);

// This flag is used by client components to enable/disable purchase button
// based ONLY on the two primary keys for basic operation.
// This is deprecated as client-side cannot reliably check server-side secret.
// We now rely on STRIPE_PUBLISHABLE_KEY for client-side button enable, and server handles the rest.
// const stripeSuccessfullyInitialized = !!STRIPE_PUBLISHABLE_KEY && !!STRIPE_SECRET_KEY;
// console.log(`[Stripe Config] DEPRECATED stripeSuccessfullyInitialized (for enabling purchase button, based on Publishable and Secret keys only) evaluated to: ${stripeSuccessfullyInitialized}`);

// Server-side check for API readiness (secret key is essential for API calls)
const stripeServerApiKeysPresent =
  !!STRIPE_SECRET_KEY && !!STRIPE_JOB_POST_PRICE_ID; // Check secret key and price ID for API
console.log(`[Stripe Config] Server API Core Keys Check (Secret Key, Price ID): ${stripeServerApiKeysPresent ? 'Present' : 'INCOMPLETE'}`);

if (!stripeServerApiKeysPresent) {
  const missingKeys: string[] = [];
  if (!STRIPE_SECRET_KEY) missingKeys.push("NEXT_STRIPE_SECRET_KEY (trimmed value is missing/empty)");
  if (!STRIPE_JOB_POST_PRICE_ID) missingKeys.push("NEXT_PUBLIC_STRIPE_PRICE_PREMIUM (trimmed value is missing/empty)");
  console.warn(`[Stripe Config] SERVER-SIDE Stripe API calls may fail or be incomplete. Missing/empty core server keys: [${missingKeys.join(', ')}]. Ensure these are set in .env.local and server is restarted.`);
}

if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] IMPORTANT FOR POST-PURCHASE PROCESSING: 'STRIPE_WEBHOOK_SECRET' is missing or empty. Payment confirmation and post crediting via webhooks will fail. Please set this in .env.local and restart the server.");
}

const allStripeVarsPresentForFullFunctionality =
    !!STRIPE_PUBLISHABLE_KEY &&    // Client needs this
    !!STRIPE_SECRET_KEY &&         // Server needs this for API
    !!STRIPE_WEBHOOK_SECRET &&     // Server needs this for webhooks
    !!STRIPE_JOB_POST_PRICE_ID;    // Client & Server need this for specific product

if (!allStripeVarsPresentForFullFunctionality) {
    console.warn("[Stripe Config] === For FULL Stripe functionality (UI, purchase, AND crediting posts), please ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and NEXT_PUBLIC_STRIPE_PRICE_PREMIUM are set in your .env.local file and RESTART the Next.js server. ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables for full functionality appear to be present and trimmed correctly based on server-side checks.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");
