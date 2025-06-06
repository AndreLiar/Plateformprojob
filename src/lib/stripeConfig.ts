
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
export const STRIPE_PUBLISHABLE_KEY = rawPublishableKey?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: RawValue='${rawPublishableKey || "Not set (raw)"}', Type='${typeof rawPublishableKey}', TrimmedValue='${STRIPE_PUBLISHABLE_KEY || "Not set (trimmed)"}'`);

// Stripe Secret Key (for server-side API calls)
const rawSecretKey = process.env.STRIPE_SECRET_KEY;
export const STRIPE_SECRET_KEY = rawSecretKey?.trim();
// Log only an indicator for secret keys for security, but confirm type and if set
console.log(`[Stripe Config] STRIPE_SECRET_KEY: RawIsSet='${!!rawSecretKey}', RawType='${typeof rawSecretKey}', TrimmedIsSet='${!!STRIPE_SECRET_KEY}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_WEBHOOK_SECRET = rawWebhookSecret?.trim();
// Log only an indicator for secret keys
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: RawIsSet='${!!rawWebhookSecret}', RawType='${typeof rawWebhookSecret}', TrimmedIsSet='${!!STRIPE_WEBHOOK_SECRET}'`);

// Stripe Price ID for the "Job Post" product (e.g., 5 EUR per post)
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID;
export const STRIPE_JOB_POST_PRICE_ID = rawJobPostPriceId?.trim();
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID: RawValue='${rawJobPostPriceId || "Not set (raw)"}', Type='${typeof rawJobPostPriceId}', TrimmedValue='${STRIPE_JOB_POST_PRICE_ID || "Not set (trimmed)"}'`);

// A boolean to check if all necessary Stripe variables are set (using trimmed values)
export const stripeSuccessfullyInitialized =
  !!STRIPE_PUBLISHABLE_KEY &&
  !!STRIPE_SECRET_KEY &&
  !!STRIPE_WEBHOOK_SECRET &&
  !!STRIPE_JOB_POST_PRICE_ID;

console.log(`[Stripe Config] stripeSuccessfullyInitialized evaluated to: ${stripeSuccessfullyInitialized} (based on trimmed values)`);

if (!stripeSuccessfullyInitialized) {
  const missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (is empty or missing after trim)");
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY (is empty or missing after trim)");
  if (!STRIPE_WEBHOOK_SECRET) missingKeys.push("STRIPE_WEBHOOK_SECRET (is empty or missing after trim)");
  if (!STRIPE_JOB_POST_PRICE_ID) missingKeys.push("NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID (is empty or missing after trim)");

  const message = `[Stripe Config] Stripe configuration is INCOMPLETE. One or more required environment variables are missing, empty, or consist only of whitespace: [${missingKeys.join(', ')}]. Stripe functionality will be disabled or limited.`;

  console.warn(message);
  console.warn("[Stripe Config] === PLEASE VERIFY your .env.local file and RESTART the Next.js server. ===");
  console.warn("[Stripe Config] Check that the variable names are EXACTLY correct and that they have non-empty values.");
  console.warn("[Stripe Config] Values Next.js is seeing from process.env (raw, before trim):");
  console.warn(`  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (raw): ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'NOT FOUND IN process.env'}`);
  console.warn(`  - STRIPE_SECRET_KEY (raw): ${process.env.STRIPE_SECRET_KEY ? 'FOUND (value hidden)' : 'NOT FOUND IN process.env'}`);
  console.warn(`  - STRIPE_WEBHOOK_SECRET (raw): ${process.env.STRIPE_WEBHOOK_SECRET ? 'FOUND (value hidden)' : 'NOT FOUND IN process.env'}`);
  console.warn(`  - NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID (raw): ${process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID || 'NOT FOUND IN process.env'}`);
  console.warn("[Stripe Config] === End of diagnostic printout ===");

} else {
  console.log("[Stripe Config] Stripe configuration appears COMPLETE and all required variables are loaded and non-empty after trimming.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");

// Client-side warning (less critical if server-side is fine, but good for completeness)
if (typeof window !== 'undefined') { // Running on the client
    if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_JOB_POST_PRICE_ID) {
      // console.warn("[Stripe Config Client] Client-side check: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID might be missing or empty. This could affect Stripe.js initialization if server-side checks also failed.");
    }
}
