
// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_JOB_POST_PRICE_ID } from '@/lib/stripeConfig';

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe API Error: Stripe secret key (STRIPE_SECRET_KEY from stripeConfig) is not available. This key is derived from the NEXT_STRIPE_SECRET_KEY environment variable. Cannot create Stripe client for checkout session.');
    return NextResponse.json({ error: 'Server configuration error: Stripe secret key is missing or invalid. Please contact support or the site administrator.' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const body = await req.json();
    const { userId, priceId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }
    if (!priceId) {
        return NextResponse.json({ error: 'Price ID is required.' }, { status: 400 });
    }
    
    if (priceId !== STRIPE_JOB_POST_PRICE_ID) {
        console.warn(`Stripe API Warning: Received priceId '${priceId}' does not match configured STRIPE_JOB_POST_PRICE_ID (derived from NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) which is '${STRIPE_JOB_POST_PRICE_ID}'. Check client-side (JobPostForm.tsx) and env (NEXT_PUBLIC_STRIPE_PRICE_PREMIUM) configuration.`);
        return NextResponse.json({ error: 'Invalid Price ID provided. Please refresh and try again.' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:9002'; // Adjust if your dev port is different
    
    const successUrl = `${origin}/dashboard/post-job?session_id={CHECKOUT_SESSION_ID}&purchase=success`;
    const cancelUrl = `${origin}/dashboard/post-job?purchase=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the validated priceId
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Store userId for webhook processing
    });

    if (!session.id) {
        console.error('Stripe API Error: Failed to create Stripe session - No session ID returned from Stripe.');
        throw new Error('Failed to create Stripe session: No session ID returned.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe Checkout Session Error in API route:', error);
    if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json({ error: `Stripe API Error: ${error.message}`, type: error.type }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create Stripe checkout session due to an unexpected server error.' }, { status: 500 });
  }
}
