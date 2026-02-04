/**
 * MYSTATION - Live Stream Tips/Donations
 * Process tips via Stripe, show on stream
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, name, message, streamId } = await request.json();

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      // Demo mode - return success without processing
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Tip recorded (demo mode - configure Stripe to process payments)',
      });
    }

    // Dynamic import Stripe only when configured
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'live_tip',
        streamId,
        tipperName: name,
        message: message?.slice(0, 200) || '',
      },
      description: `MyStation Live Tip - ${name}`,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating tip:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process tip' },
      { status: 500 }
    );
  }
}
