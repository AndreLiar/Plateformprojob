
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY;
export const STRIPE_SECRET_KEY = rawSecretKey?.trim(); // Directly export the trimmed secret key
console.log(`[Stripe Config] NEXT_STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!STRIPE_SECRET_KEY}'`);

// Stripe Price ID for the "Job Post" product - now read from NEXT_PUBLIC_
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PRICE_PREMIUM (for Job Post Price ID): RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}' (Server-side only)`);

// --- Client-side Button Enablement Check ---
// This flag indicates if the basic client-side setup for Stripe (Publishable Key) is present.
// The purchase button in JobPostForm.tsx will be enabled if this is true.
export const clientSideStripePublishableKeyPresent = !!STRIPE_PUBLISHABLE_KEY;
console.log(`[Stripe Config] clientSideStripePublishableKeyPresent (for UI button enablement) evaluated to: ${clientSideStripePublishableKeyPresent}`);


// --- Server-side API Readiness Checks & Warnings ---
const serverApiCoreKeysPresent = !!STRIPE_SECRET_KEY && !!STRIPE_JOB_POST_PRICE_ID;
console.log(`[Stripe Config] Server API Core Keys Check (Secret Key & Price ID for API): ${serverApiCoreKeysPresent ? 'Present' : 'INCOMPLETE'}`);

if (!STRIPE_SECRET_KEY) {
  console.warn(`[Stripe Config] SERVER-SIDE Stripe API calls will fail. Critical key 'NEXT_STRIPE_SECRET_KEY' is missing or empty in your .env.local file. Please set this and restart the server.`);
}
if (!STRIPE_JOB_POST_PRICE_ID) {
  console.warn(`[Stripe Config] SERVER-SIDE Stripe API calls for job post purchase will fail. Key 'NEXT_PUBLIC_STRIPE_PRICE_PREMIUM' (for Job Post Price ID) is missing or empty. Please set this and restart the server.`);
}


if (!STRIPE_WEBHOOK_SECRET) {
    console.warn("[Stripe Config] IMPORTANT FOR POST-PURCHASE PROCESSING: 'STRIPE_WEBHOOK_SECRET' is missing or empty in your .env.local file. Payment confirmation and post crediting via webhooks will fail. Please set this and restart the server.");
}

const allStripeVarsPresentForFullFunctionality =
    !!STRIPE_PUBLISHABLE_KEY &&
    !!STRIPE_SECRET_KEY &&
    !!STRIPE_WEBHOOK_SECRET &&
    !!STRIPE_JOB_POST_PRICE_ID;

if (!allStripeVarsPresentForFullFunctionality) {
    console.warn("[Stripe Config] === For FULL Stripe functionality (UI, purchase, AND crediting posts), please ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PRICE_PREMIUM, and STRIPE_WEBHOOK_SECRET are correctly set in your .env.local file and RESTART the Next.js server. ===");
} else {
    console.log("[Stripe Config] All four Stripe-related environment variables for full functionality appear to be present and trimmed correctly based on server-side checks.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");
