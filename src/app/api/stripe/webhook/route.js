/**
 * MYSTATION - Stripe Webhook Handler
 * Receives payment confirmations and creates Printful orders
 *
 * Flow:
 * 1. Customer pays on MyStation
 * 2. Stripe sends webhook to this endpoint
 * 3. We create order on Printful with shipping address
 * 4. Printful prints and ships, sends tracking to customer
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { printful } from '@/lib/printful';

// Stripe webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    let event;

    // Verify webhook signature
    if (webhookSecret && webhookSecret !== 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET') {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
          { error: 'Webhook signature verification failed' },
          { status: 400 }
        );
      }
    } else {
      // No webhook secret configured - parse event directly (not recommended for production)
      event = JSON.parse(body);
      console.warn('WARNING: Webhook signature verification is disabled');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Creates Printful order with shipping address and items
 */
async function handleCheckoutCompleted(session, stripe) {
  console.log('Processing checkout session:', session.id);

  try {
    // Get full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product', 'customer_details'],
    });

    // Extract shipping address
    const shipping = fullSession.shipping_details || fullSession.customer_details;
    if (!shipping || !shipping.address) {
      console.error('No shipping address found in session');
      // Still mark as processed but log the issue
      return;
    }

    // Check if this is a merch order (not subscription)
    const lineItems = fullSession.line_items?.data || [];
    const merchItems = lineItems.filter(item => {
      // Filter out subscriptions - only physical products
      return item.price?.type !== 'recurring';
    });

    if (merchItems.length === 0) {
      console.log('No merch items in order - subscription only');
      return;
    }

    // Build Printful order
    const printfulOrder = {
      external_id: session.id,
      recipient: {
        name: shipping.name || fullSession.customer_details?.name || 'Customer',
        address1: shipping.address.line1,
        address2: shipping.address.line2 || '',
        city: shipping.address.city,
        state_code: shipping.address.state,
        country_code: shipping.address.country,
        zip: shipping.address.postal_code,
        email: fullSession.customer_details?.email || session.customer_email,
        phone: fullSession.customer_details?.phone || '',
      },
      items: [],
    };

    // Get order metadata if available (contains Printful variant IDs)
    const metadata = session.metadata || {};

    // Try to get items from metadata first
    if (metadata.printful_items) {
      try {
        const printfulItems = JSON.parse(metadata.printful_items);
        printfulOrder.items = printfulItems.map(item => ({
          sync_variant_id: item.sync_variant_id,
          quantity: item.quantity,
        }));
      } catch (e) {
        console.error('Failed to parse printful_items metadata:', e);
      }
    }

    // If no items from metadata, try to match by product name
    if (printfulOrder.items.length === 0) {
      // Fetch store products to match by name
      try {
        const storeProducts = await printful.getStoreProducts();

        for (const item of merchItems) {
          const productName = item.description || item.price?.product?.name || '';

          // Find matching Printful product
          for (const storeProduct of storeProducts) {
            const fullProduct = await printful.getStoreProduct(storeProduct.id);

            // Check sync variants
            for (const variant of fullProduct.sync_variants || []) {
              if (variant.name.toLowerCase().includes(productName.toLowerCase()) ||
                  productName.toLowerCase().includes(variant.name.toLowerCase())) {
                printfulOrder.items.push({
                  sync_variant_id: variant.id,
                  quantity: item.quantity,
                });
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to match products with Printful:', e);
      }
    }

    // Create order on Printful
    if (printfulOrder.items.length > 0) {
      console.log('Creating Printful order:', JSON.stringify(printfulOrder, null, 2));

      const order = await printful.createOrder(printfulOrder, true); // confirm=true to submit immediately

      console.log('Printful order created:', order.id);
      console.log('Status:', order.status);

      // Log for debugging
      return {
        success: true,
        printfulOrderId: order.id,
        status: order.status,
      };
    } else {
      console.error('Could not match any items with Printful products');
      console.log('Line items:', JSON.stringify(merchItems, null, 2));
    }
  } catch (error) {
    console.error('Failed to create Printful order:', error);
    // Don't throw - we don't want to retry the webhook for Printful errors
    // The order is paid, we'll need to manually fulfill if this fails
  }
}
