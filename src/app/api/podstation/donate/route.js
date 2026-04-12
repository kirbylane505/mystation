import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { amount, streamId, streamerName, tipperName } = await req.json();

    if (!amount || amount < 1 || amount > 500) {
      return NextResponse.json({ error: 'Invalid amount ($1-$500)' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Donate to ${streamerName || 'Streamer'}`,
            description: `PodStation live stream donation`,
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'podstation_donation',
        stream_id: streamId || '',
        streamer_name: streamerName || '',
        tipper_name: tipperName || '',
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com'}/podstation/${streamId}?donated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mystationlive.com'}/podstation/${streamId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('PodStation donate error:', err);
    return NextResponse.json({ error: 'Failed to create donation' }, { status: 500 });
  }
}
