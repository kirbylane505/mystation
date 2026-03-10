/**
 * MYSTATION - Stripe Checkout Session
 * Creates a Stripe Checkout session for merch purchases
 */
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { items, email, discountCode } = await request.json();

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Server-side price validation — reject manipulated prices
    for (const item of items) {
      if (!item.price || typeof item.price !== 'number' || item.price < 1 || item.price > 500) {
        return NextResponse.json(
          { success: false, error: 'Invalid item price' },
          { status: 400 }
        );
      }
      if (!item.name || typeof item.name !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid item name' },
          { status: 400 }
        );
      }
      if (!item.quantity || item.quantity < 1 || item.quantity > 20) {
        return NextResponse.json(
          { success: false, error: 'Invalid quantity' },
          { status: 400 }
        );
      }
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not configured — checkout unavailable');
      return NextResponse.json(
        { success: false, error: 'Checkout is temporarily unavailable' },
        { status: 503 }
      );
    }

    // Import and initialize Stripe at runtime (use SDK default API version)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey);

    // Verify prices against Printify/Printful catalog when variant IDs are provided
    if (items.some(item => item.printifyProductId && item.printifyVariantId)) {
      try {
        const { printify } = await import('@/lib/printify');
        for (const item of items) {
          if (!item.printifyProductId || !item.printifyVariantId) continue;
          const product = await printify.getStoreProduct(item.printifyProductId);
          if (product?.variants) {
            const variant = product.variants.find(v => v.id === item.printifyVariantId);
            if (variant) {
              // Server price is in cents, client price is in dollars
              const serverPrice = variant.price / 100;
              if (Math.abs(item.price - serverPrice) > 0.01) {
                console.error(`Price mismatch: client=${item.price}, server=${serverPrice}, product=${item.name}`);
                return NextResponse.json(
                  { success: false, error: 'Price verification failed. Please refresh and try again.' },
                  { status: 400 }
                );
              }
            }
          }
        }
      } catch (e) {
        console.error('Price verification warning:', e.message);
        // Continue — don't block checkout if catalog lookup fails
      }
    }

    // Calculate bundle discount based on total item count
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    let discountPercent = 0;
    if (totalQuantity >= 5) discountPercent = 15;
    else if (totalQuantity >= 2) discountPercent = 10;

    // Promo code discounts (stacks with bundle if code is better)
    const PROMO_CODES = {
      'WELCOME10': 10,
      'REFER15': 15,
    };
    const promoDiscount = discountCode ? (PROMO_CODES[discountCode.toUpperCase()] || 0) : 0;
    // Use whichever discount is higher
    discountPercent = Math.max(discountPercent, promoDiscount);
    const discountMultiplier = 1 - discountPercent / 100;

    // Build line items for Stripe (with bundle discount applied)
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name + (discountPercent > 0 ? ` (${discountPercent}% bundle deal)` : ''),
          description: item.variantName || undefined,
          images: item.image && item.image.startsWith('http') ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100 * discountMultiplier), // Apply discount
      },
      quantity: item.quantity,
    }));

    // Build Printful items metadata for webhook (truncate names to stay under Stripe 500-char metadata limit)
    const printfulItems = items
      .filter(item => item.printfulSyncVariantId)
      .map(item => ({
        sync_variant_id: item.printfulSyncVariantId,
        quantity: item.quantity,
        name: (item.name || '').slice(0, 40),
      }));

    // Build Printify items metadata for webhook
    const printifyItems = items
      .filter(item => item.printifyProductId && item.printifyVariantId)
      .map(item => ({
        product_id: item.printifyProductId,
        variant_id: item.printifyVariantId,
        quantity: item.quantity,
        name: (item.name || '').slice(0, 40),
      }));

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
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
      // Store item data for webhook to create orders with both providers
      metadata: {
        printful_items: JSON.stringify(printfulItems),
        printify_items: JSON.stringify(printifyItems),
        source: 'mystation',
      },
      success_url: `https://mystationlive.com/checkout/success?session_id={CHECKOUT_SESSION_ID}&auto_sub=1${email ? '&email=' + encodeURIComponent(email) : ''}`,
      cancel_url: 'https://mystationlive.com/checkout',
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    const msg = error?.type === 'StripeInvalidRequestError'
      ? `Payment error: ${error.message}`
      : 'Checkout failed. Please try again.';
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
