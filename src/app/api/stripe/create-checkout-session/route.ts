
// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_JOB_POST_PRICE_ID } from '@/lib/stripeConfig'; // Import STRIPE_SECRET_KEY directly

export async function POST(req: NextRequest) {
  // STRIPE_SECRET_KEY is now imported directly from stripeConfig
  if (!STRIPE_SECRET_KEY) {
    console.error('Stripe secret key (STRIPE_SECRET_KEY from config) is not set or invalid. Cannot create Stripe client for checkout session.');
    return NextResponse.json({ error: 'Server configuration error: Stripe secret key is missing or invalid.' }, { status: 500 });
  }
  // Initialize Stripe client inside the handler using the imported STRIPE_SECRET_KEY
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
    // STRIPE_JOB_POST_PRICE_ID is imported and used for validation
    if (priceId !== STRIPE_JOB_POST_PRICE_ID) {
        console.warn(`Received priceId ${priceId} does not match configured STRIPE_JOB_POST_PRICE_ID ${STRIPE_JOB_POST_PRICE_ID}`);
        // Depending on policy, you might want to return an error here or proceed if priceId is otherwise valid.
        // For now, we'll proceed but log a warning.
    }

    const origin = req.headers.get('origin') || 'http://localhost:9002'; 
    
    const successUrl = `${origin}/dashboard/post-job?session_id={CHECKOUT_SESSION_ID}&purchase=success`;
    const cancelUrl = `${origin}/dashboard/post-job?purchase=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the priceId received from the client
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Store userId for webhook processing
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session: No session ID returned.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    // Check if it's a Stripe specific error
    if (error instanceof Stripe.errors.StripeError) {
        return NextResponse.json({ error: `Stripe Error: ${error.message}`, type: error.type }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create Stripe session.' }, { status: 500 });
  }
}
