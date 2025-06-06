
// src/lib/stripeConfig.ts

console.log("--- Stripe Configuration Check (Server-Side) ---");

// Stripe Publishable Key (for client-side Stripe.js initialization)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Value='${STRIPE_PUBLISHABLE_KEY || "Not set"}', Type='${typeof STRIPE_PUBLISHABLE_KEY}'`);

// Stripe Secret Key (for server-side API calls)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
// Log only a portion of secret key for security, but indicate if it's set
console.log(`[Stripe Config] STRIPE_SECRET_KEY: IsSet='${!!STRIPE_SECRET_KEY}', StartsWith='${STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 7) + "..." : "Not set"}', Type='${typeof STRIPE_SECRET_KEY}'`);

// Stripe Webhook Secret (for verifying webhook signatures on the server)
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// Log only a portion for security
console.log(`[Stripe Config] STRIPE_WEBHOOK_SECRET: IsSet='${!!STRIPE_WEBHOOK_SECRET}', StartsWith='${STRIPE_WEBHOOK_SECRET ? STRIPE_WEBHOOK_SECRET.substring(0, 10) + "..." : "Not set"}', Type='${typeof STRIPE_WEBHOOK_SECRET}'`);

// Stripe Price ID for the "Job Post" product (e.g., 5 EUR per post)
export const STRIPE_JOB_POST_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID;
console.log(`[Stripe Config] NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID: Value='${STRIPE_JOB_POST_PRICE_ID || "Not set"}', Type='${typeof STRIPE_JOB_POST_PRICE_ID}'`);

// A boolean to check if all necessary Stripe variables are set
export const stripeSuccessfullyInitialized =
  !!STRIPE_PUBLISHABLE_KEY &&
  !!STRIPE_SECRET_KEY &&
  !!STRIPE_WEBHOOK_SECRET &&
  !!STRIPE_JOB_POST_PRICE_ID;

console.log(`[Stripe Config] stripeSuccessfullyInitialized evaluated to: ${stripeSuccessfullyInitialized}`);

if (!stripeSuccessfullyInitialized) {
  const missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY");
  if (!STRIPE_WEBHOOK_SECRET) missingKeys.push("STRIPE_WEBHOOK_SECRET");
  if (!STRIPE_JOB_POST_PRICE_ID) missingKeys.push("NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID");

  const message = `[Stripe Config] Stripe configuration is INCOMPLETE. One or more required environment variables are missing or empty: [${missingKeys.join(', ')}]. Stripe functionality will be disabled or limited.`;

  console.warn(message);
  console.warn("[Stripe Config] === PLEASE VERIFY your .env.local file and RESTART the Next.js server. ===");
  console.warn("[Stripe Config] Values Next.js is seeing from process.env:");
  console.warn(`  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'NOT FOUND IN process.env'}`);
  console.warn(`  - STRIPE_SECRET_KEY: ${process.env.STRIPE_SECRET_KEY ? 'FOUND (value hidden for security)' : 'NOT FOUND IN process.env'}`);
  console.warn(`  - STRIPE_WEBHOOK_SECRET: ${process.env.STRIPE_WEBHOOK_SECRET ? 'FOUND (value hidden for security)' : 'NOT FOUND IN process.env'}`);
  console.warn(`  - NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID: ${process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID || 'NOT FOUND IN process.env'}`);
  console.warn("[Stripe Config] === End of diagnostic printout ===");

} else {
  console.log("[Stripe Config] Stripe configuration appears COMPLETE and all required variables are loaded.");
}
console.log("--- End Stripe Configuration Check (Server-Side) ---");

// (Original client-side warning logic can remain if desired, but server logs are key here)
if (typeof window !== 'undefined') { // Running on the client
    if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_JOB_POST_PRICE_ID) {
      // This message in browser console might be confusing if server already logged details.
      // console.warn("[Stripe Config Client] Stripe client-side configuration (publishable key or price ID) appears incomplete based on runtime check. Payment features may not work correctly if server also failed to load them.");
    }
}
