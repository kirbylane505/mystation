/**
 * MYSTATION - Stripe Checkout Session
 * Creates a Stripe Checkout session for merch purchases
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { items, email } = await request.json();

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Demo mode - simulate successful checkout
      return NextResponse.json({
        success: true,
        demo: true,
        orderId: 'DEMO-' + Date.now(),
        message: 'Order placed (demo mode)',
      });
    }

    // Import and initialize Stripe at runtime
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    // Build line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.variantName || undefined,
          images: item.image && item.image.startsWith('http') ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Build Printful items metadata for webhook
    const printfulItems = items
      .filter(item => item.printfulSyncVariantId)
      .map(item => ({
        sync_variant_id: item.printfulSyncVariantId,
        quantity: item.quantity,
        name: item.name,
      }));

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'klarna', 'afterpay_clearpay'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email || undefined,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 599,
              currency: 'usd',
            },
            display_name: 'Standard Shipping (5-10 days)',
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1299,
              currency: 'usd',
            },
            display_name: 'Express Shipping (2-4 days)',
          },
        },
      ],
      // Store Printful item data for webhook to create order
      metadata: {
        printful_items: JSON.stringify(printfulItems),
        source: 'mystation',
      },
      success_url: 'https://mystationlive.com/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://mystationlive.com/checkout',
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout failed' },
      { status: 500 }
    );
  }
}
