import { type Stripe, loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from './stripeConfig';

let stripePromise: Promise<Stripe | null>;

const getStripe = (): Promise<Stripe | null> => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('Stripe publishable key is not set in environment variables. Stripe.js will not be loaded.');
    // Return a promise that resolves to null if the key is missing
    return Promise.resolve(null); 
  }
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export default getStripe;
