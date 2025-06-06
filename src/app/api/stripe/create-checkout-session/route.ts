// src/app/api/stripe/create-checkout-session/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_JOB_POST_PRICE_ID } from '@/lib/stripeConfig';

if (!STRIPE_SECRET_KEY) {
  throw new Error('Stripe secret key is not set in environment variables.');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export async function POST(req: NextRequest) {
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
        // Optional: a sanity check if you only ever sell one type of post credit this way.
        console.warn(`Received priceId ${priceId} does not match configured STRIPE_JOB_POST_PRICE_ID ${STRIPE_JOB_POST_PRICE_ID}`);
        // Decide if you want to error out or proceed with the provided priceId
        // For now, let's proceed but log a warning.
    }

    const origin = req.headers.get('origin') || 'http://localhost:9002'; // Fallback for local dev if origin is not available
    
    // Ensure success and cancel URLs are absolute
    const successUrl = `${origin}/dashboard/post-job?session_id={CHECKOUT_SESSION_ID}&purchase=success`;
    const cancelUrl = `${origin}/dashboard/post-job?purchase=cancelled`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the priceId passed from the client
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId, // Crucial for webhook to identify the user
      // To add customer email to Stripe checkout page (optional, Stripe can collect it too)
      // customer_email: userEmail, // You would need to fetch/pass the user's email for this
    });

    if (!session.id) {
        throw new Error('Failed to create Stripe session: No session ID returned.');
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Stripe session.' }, { status: 500 });
  }
}
