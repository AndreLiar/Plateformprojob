// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
// This import is where the error "Export STRIPE_SECRET_KEY doesn't exist" occurs if stripeConfig.ts doesn't export it.
import { STRIPE_SECRET_KEY, STRIPE_JOB_POST_PRICE_ID } from '@/lib/stripeConfig';

export async function POST(req: NextRequest) {
  // Directly check if STRIPE_SECRET_KEY was successfully imported and has a value.
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe API Error in create-checkout-session route: STRIPE_SECRET_KEY from stripeConfig is undefined or empty. This likely means the NEXT_STRIPE_SECRET_KEY environment variable is not being correctly passed to or read by the server. Stripe client cannot be initialized.');
    return NextResponse.json({ error: 'Server configuration error: Stripe secret key is missing or invalid. Please contact support or the site administrator.' }, { status: 500 });
  }

  // Initialize Stripe with the secret key.
  // The STRIPE_SECRET_KEY constant is now guaranteed to be a string if we passed the check above.
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const body = await req.json();
    const { userId, priceId: receivedPriceId } = body; // Renamed to avoid conflict with imported STRIPE_JOB_POST_PRICE_ID

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    if (!receivedPriceId) {
        return NextResponse.json({ error: 'Price ID from request body is required.' }, { status: 400 });
    }
    
    // Check if STRIPE_JOB_POST_PRICE_ID from config is available
    if (!STRIPE_JOB_POST_PRICE_ID) {
        console.error('Stripe API Error in create-checkout-session route: STRIPE_JOB_POST_PRICE_ID from stripeConfig is undefined or empty. This likely means the NEXT_PUBLIC_STRIPE_PRICE_PREMIUM environment variable is not set.');
        return NextResponse.json({ error: 'Server configuration error: Job post price is not configured.' }, { status: 500 });
    }

    // Validate the receivedPriceId against the one configured in .env.local (via stripeConfig.ts)
    if (receivedPriceId !== STRIPE_JOB_POST_PRICE_ID) {
        console.warn(`Stripe API Warning: Received priceId '${receivedPriceId}' from client does not match configured STRIPE_JOB_POST_PRICE_ID ('${STRIPE_JOB_POST_PRICE_ID}'). Check client-side (JobPostForm.tsx) and environment variable (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) configuration.`);
        return NextResponse.json({ error: 'Invalid Price ID provided. Please ensure you are using the correct product.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:9002'; // Adjust if your dev port is different
    
    const successUrl = `${origin}/dashboard/post-job?session_id={CHECKOUT_SESSION_ID}&purchase=success`;
    const cancelUrl = `${origin}/dashboard/post-job?purchase=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_JOB_POST_PRICE_ID, // Use the validated priceId from stripeConfig
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, 
    });

    if (!session.id) {
        console.error('Stripe API Error: Failed to create Stripe session - No session ID returned from Stripe.');
        // This case should ideally not happen if Stripe API call is successful.
        throw new Error('Failed to create Stripe session: No session ID returned.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe Checkout Session Error in API route:', error);
    if (error instanceof Stripe.errors.StripeError) {
        // Handle specific Stripe errors
        return NextResponse.json({ error: `Stripe API Error: ${error.message}`, type: error.type }, { status: error.statusCode || 500 });
    }
    // Handle other unexpected errors
    return NextResponse.json({ error: error.message || 'Failed to create Stripe checkout session due to an unexpected server error.' }, { status: 500 });
  }
}
