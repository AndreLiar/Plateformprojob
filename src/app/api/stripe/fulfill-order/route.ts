
// src/app/api/stripe/fulfill-order/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '@/lib/stripeConfig';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    console.error('Fulfill Order API Error: STRIPE_SECRET_KEY is not configured.');
    return NextResponse.json({ error: 'Server configuration error: Stripe secret key missing.' }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const body = await req.json();
    const { sessionId, userId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'], // Expand line items to potentially get quantity in the future
    });

    if (session.payment_status === 'paid') {
      // Verify client_reference_id matches the userId from the request
      if (session.client_reference_id !== userId) {
        console.error(`Fulfill Order API Error: User ID mismatch. Session client_reference_id: ${session.client_reference_id}, Request userId: ${userId}`);
        return NextResponse.json({ error: 'User ID mismatch. Cannot fulfill order.' }, { status: 403 });
      }

      // For now, assume 1 purchased post per successful transaction as per current setup.
      // In future, if multiple posts can be bought, use session.line_items[0].quantity
      const quantityPurchased = 1; 

      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        purchasedPostsRemaining: increment(quantityPurchased),
      });

      return NextResponse.json({ message: 'Order fulfilled successfully, posts updated.' });
    } else {
      console.warn(`Fulfill Order API: Payment not successful for session ${sessionId}. Status: ${session.payment_status}`);
      return NextResponse.json({ error: 'Payment not successful.' }, { status: 402 });
    }
  } catch (error: any) {
    console.error('Fulfill Order API Error:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: `Stripe API Error: ${error.message}`, type: error.type }, { status: error.statusCode || 500 });
    }
    return NextResponse.json({ error: error.message || 'Failed to fulfill order due to an unexpected server error.' }, { status: 500 });
  }
}
