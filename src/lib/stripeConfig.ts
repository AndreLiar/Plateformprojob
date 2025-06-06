
// Stripe Publishable Key (for client-side Stripe.js initialization)
// Ensure this is prefixed with NEXT_PUBLIC_ in your .env.local file
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Stripe Secret Key (for server-side API calls)
// This should NOT be prefixed with NEXT_PUBLIC_
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Stripe Webhook Secret (for verifying webhook signatures on the server)
// This should NOT be prefixed with NEXT_PUBLIC_
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe Price ID for the "Job Post" product (e.g., 10 EUR per post)
// This can be public if needed on the client to initiate checkout
export const STRIPE_JOB_POST_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID;

// A boolean to check if all necessary Stripe variables are set
export const stripeSuccessfullyInitialized = 
  !!STRIPE_PUBLISHABLE_KEY && 
  !!STRIPE_SECRET_KEY && 
  !!STRIPE_WEBHOOK_SECRET &&
  !!STRIPE_JOB_POST_PRICE_ID;

// Log a warning if Stripe configuration is incomplete
if (!stripeSuccessfullyInitialized) {
  let missingKeys: string[] = [];
  if (!STRIPE_PUBLISHABLE_KEY) missingKeys.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY");
  if (!STRIPE_WEBHOOK_SECRET) missingKeys.push("STRIPE_WEBHOOK_SECRET");
  if (!STRIPE_JOB_POST_PRICE_ID) missingKeys.push("NEXT_PUBLIC_STRIPE_JOB_POST_PRICE_ID");

  const message = `Stripe configuration is incomplete. Missing environment variable(s): ${missingKeys.join(', ')}. Stripe functionality will be disabled or limited. Please ensure these are set in your .env.local file.`;
  
  // Only log detailed server-side key warnings on the server.
  // Client-side warnings should be more generic or specific to public keys.
  if (typeof window === 'undefined') { // Running on the server
    console.warn(message);
  } else { // Running on the client
    if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_JOB_POST_PRICE_ID) {
      console.warn("Stripe client-side configuration (publishable key or price ID) is incomplete. Payment features may not work correctly.");
    }
  }
}
