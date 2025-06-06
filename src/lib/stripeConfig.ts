// src/lib/stripeConfig.ts

// --- 1. Read Environment Variables ---
// These are read from your .env.local file or server environment.
const rawPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const rawSecretKey = process.env.NEXT_STRIPE_SECRET_KEY; // This is for server-side use.
const rawJobPostPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;

// --- 2. Define and Export Constants ---
// These constants will be imported by other parts of your application.

/**
 * Your Stripe publishable key (e.g., pk_test_YOUR_KEY or pk_live_YOUR_KEY).
 * Intended for client-side use with Stripe.js.
 * Derived from NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.
 */
export const STRIPE_PUBLISHABLE_KEY: string | undefined = rawPublishableKey?.trim();

/**
 * Your Stripe secret key (e.g., sk_test_YOUR_KEY or sk_live_YOUR_KEY).
 * Intended for server-side API calls to Stripe.
 * Derived from NEXT_STRIPE_SECRET_KEY environment variable.
 * THIS IS THE CRUCIAL EXPORT for the API route.
 */
export const STRIPE_SECRET_KEY: string | undefined = rawSecretKey?.trim();

/**
 * The Stripe Price ID for your job posting product (e.g., price_xxxxxxxxxxxxxx).
 * Used to create Stripe Checkout sessions.
 * Derived from NEXT_PUBLIC_STRIPE_PRICE_PREMIUM environment variable.
 */
export const STRIPE_JOB_POST_PRICE_ID: string | undefined = rawJobPostPriceId?.trim();


// --- 3. Client-side convenience flags (optional, but can be useful for UI logic) ---

/**
 * A boolean flag indicating if the Stripe publishable key is present.
 * Useful for client-side components to check if Stripe.js can be initialized.
 */
export const clientSideStripePublishableKeyPresent = !!STRIPE_PUBLISHABLE_KEY;

/**
 * A boolean flag indicating if the Stripe job post Price ID is present.
 * Useful for client-side components to check if purchases can be initiated.
 */
export const clientSideStripePriceIdPresent = !!STRIPE_JOB_POST_PRICE_ID;

// No console logging in this file.
// If STRIPE_SECRET_KEY is undefined after this, it means NEXT_STRIPE_SECRET_KEY
// was not found or was empty in the server's environment.
