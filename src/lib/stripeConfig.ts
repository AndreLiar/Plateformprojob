
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

// Stripe Price ID for the "Job Post" product - Read from STRIPE_PRICE_PREMIUM
const rawJobPostPriceId = process.env.STRIPE_PRICE_PREMIUM;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] STRIPE_PRICE_PREMIUM (for Job Post Price ID): RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}'`);

// This flag enables the purchase button if the two core keys are present.
// Full functionality still requires Price ID and Webhook Secret.
export const stripeSuccessfullyInitialized =
  !!STRIPE_PUBLISHABLE_KEY &&
  !!STRIPE_SECRET_KEY;

console.log(`[Stripe Config] stripeSuccessfullyInitialized (for enabling purchase button, based on Publishable and Secret keys only) evaluated to: ${stripeSuccessfullyInitialized}`);

if (!stripeSuccessfullyInitialized) {
  const missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY");
  
  const message = `[Stripe Config] Basic Stripe configuration for ENABLING PURCHASE BUTTON is INCOMPLETE. Missing keys: [${missingKeys.join(', ')}]. The purchase button will be disabled.`;
  console.warn(message);
} else {
  console.log("[Stripe Config] Basic Stripe configuration (Publishable and Secret keys) for ENABLING PURCHASE BUTTON appears COMPLETE.");
  // Warnings for other keys needed for full functionality
  if (!STRIPE_JOB_POST_PRICE_ID) {
    console.warn("[Stripe Config] CRITICAL FOR PURCHASE: STRIPE_PRICE_PREMIUM (provides Job Post Price ID) is missing or empty. Users will NOT be able to complete purchases for job posts even if the button is enabled.");
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] CRITICAL FOR POST-PURCHASE: STRIPE_WEBHOOK_SECRET is missing or empty. Payment confirmation and post crediting via webhooks will fail.");
  }
}

const allStripeVarsPresentForFullFunctionality = 
    !!STRIPE_PUBLISHABLE_KEY &&
    !!STRIPE_SECRET_KEY &&
    !!STRIPE_WEBHOOK_SECRET &&
    !!STRIPE_JOB_POST_PRICE_ID;

if (!allStripeVarsPresentForFullFunctionality) {
    console.warn("[Stripe Config] === For FULL Stripe functionality (purchase AND crediting posts), please ensure all four variables are set: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_PRICE_PREMIUM, STRIPE_WEBHOOK_SECRET in your .env.local file and RESTART the Next.js server. ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables for full functionality appear to be present and trimmed correctly.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");
