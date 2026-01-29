/**
 * MYSTATION - Donation API Route
 * Processes Stripe payments to Mike Page Foundation
 */

import Stripe from 'stripe';

// Initialize Stripe with your secret key
// NOTE: Add STRIPE_SECRET_KEY to your .env.local file
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { amount, email, message } = await request.json();

    // Validate amount
    if (!amount || amount < 1) {
      return Response.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to Mike Page Foundation',
              description: 'Supporting youth music programs and community events',
              images: ['https://mystation.app/images/foundation-logo.png'],
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/donate/cancelled`,
      customer_email: email || undefined,
      metadata: {
        foundation: 'Mike Page Foundation',
        type: 'donation',
        message: message || '',
      },
      // Tax-deductible donation statement
      custom_text: {
        submit: {
          message: 'Mike Page Foundation is a 501(c)(3) nonprofit. Your donation is tax-deductible.',
        },
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Donation error:', error);
    return Response.json(
      { error: 'Failed to process donation' },
      { status: 500 }
    );
  }
}

// Webhook handler for Stripe events
export async function PUT(request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Log successful donation
        console.log('Donation successful:', {
          amount: session.amount_total / 100,
          email: session.customer_email,
          sessionId: session.id,
        });

        // TODO: Add to database, send thank you email, etc.
        break;

      case 'payment_intent.payment_failed':
        console.error('Payment failed:', event.data.object);
        break;
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
