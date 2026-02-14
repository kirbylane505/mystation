/**
 * MYSTATION - Stripe Webhook Handler
 * Receives payment confirmations and creates Printful/Printify orders
 *
 * Flow:
 * 1. Customer pays on MyStation
 * 2. Stripe sends webhook to this endpoint
 * 3. We create orders on Printful and/or Printify based on item metadata
 * 4. Each provider prints and ships their items, sends tracking to customer
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { printful } from '@/lib/printful';
import { printify } from '@/lib/printify';
import { sendSaleAlert, sendOrderConfirmation } from '@/lib/email';
import { createHmac } from 'crypto';

// Stripe webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    let event;

    // Verify webhook signature
    if (!webhookSecret || webhookSecret === 'whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET') {
      console.error('FATAL: STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, stripe);
        break;

      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Creates Printful and/or Printify orders with shipping address and items
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
    let printfulResult = null;
    if (printfulOrder.items.length > 0) {
      console.log('Creating Printful order:', JSON.stringify(printfulOrder, null, 2));

      const order = await printful.createOrder(printfulOrder, true); // confirm=true to submit immediately

      console.log('Printful order created:', order.id);
      console.log('Printful status:', order.status);

      printfulResult = { printfulOrderId: order.id, status: order.status };
    } else {
      console.log('No Printful items in this order');
    }

    // Create order on Printify
    let printifyResult = null;
    if (metadata.printify_items) {
      try {
        const printifyItems = JSON.parse(metadata.printify_items);
        if (printifyItems.length > 0) {
          const printifyOrder = {
            external_id: session.id,
            label: `MyStation Order ${session.id.slice(-8)}`,
            line_items: printifyItems.map(item => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
            })),
            shipping_method: 1,
            address_to: {
              first_name: (shipping.name || '').split(' ')[0] || 'Customer',
              last_name: (shipping.name || '').split(' ').slice(1).join(' ') || '',
              email: fullSession.customer_details?.email || session.customer_email || '',
              phone: fullSession.customer_details?.phone || '',
              country: shipping.address.country || 'US',
              region: shipping.address.state || '',
              address1: shipping.address.line1 || '',
              address2: shipping.address.line2 || '',
              city: shipping.address.city || '',
              zip: shipping.address.postal_code || '',
            },
          };

          console.log('Creating Printify order:', JSON.stringify(printifyOrder, null, 2));

          const order = await printify.createOrder(printifyOrder, true); // confirm=true sends to production

          console.log('Printify order created:', order.id);
          printifyResult = { printifyOrderId: order.id, sent_to_production: order.sent_to_production };
        }
      } catch (e) {
        console.error('Failed to create Printify order:', e);
      }
    }

    // Send email notifications BEFORE returning (don't block on failures)
    const customerEmail = fullSession.customer_details?.email || session.customer_email;
    const customerName = shipping.name || fullSession.customer_details?.name || 'Customer';
    const totalAmount = fullSession.amount_total || 0;
    const itemsForEmail = merchItems.map(item => ({
      name: item.description || item.price?.product?.name || 'Merch Item',
      quantity: item.quantity,
      amount: item.amount_total || item.price?.unit_amount * item.quantity || 0,
    }));

    // Admin sale alert
    sendSaleAlert({
      customerName,
      customerEmail,
      items: itemsForEmail,
      total: totalAmount,
      shippingAddress: shipping.address,
      sessionId: session.id,
      printfulOrderId: printfulResult?.printfulOrderId,
      printifyOrderId: printifyResult?.printifyOrderId,
    }).catch(err => console.error('Sale alert email failed:', err));

    // Customer order confirmation
    if (customerEmail) {
      sendOrderConfirmation({
        customerName,
        customerEmail,
        items: itemsForEmail,
        total: totalAmount,
        sessionId: session.id,
      }).catch(err => console.error('Order confirmation email failed:', err));
    }

    // Auto-grant 1 month subscription on any purchase
    if (customerEmail && totalAmount > 0) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const email = customerEmail.toLowerCase();
          const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          const { data: existing } = await supabase
            .from('user_trials')
            .select('purchased_sub_until')
            .eq('email', email)
            .single();

          if (existing) {
            // Only extend if new date is later than existing expiry
            const currentExpiry = existing.purchased_sub_until ? new Date(existing.purchased_sub_until) : new Date(0);
            if (oneMonthFromNow > currentExpiry) {
              await supabase
                .from('user_trials')
                .update({ purchased_sub_until: oneMonthFromNow.toISOString() })
                .eq('email', email);
            }
          } else {
            // Create new trial row with purchase sub
            await supabase.from('user_trials').insert({
              email,
              trial_started_at: new Date().toISOString(),
              purchased_sub_until: oneMonthFromNow.toISOString(),
            });
          }
        }
      } catch (e) {
        console.error('Auto-subscribe on purchase error:', e);
      }
    }

    // Track purchase analytics + spending for rewards
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from('analytics_events').insert({
          event_type: 'purchase',
          page_path: '/checkout',
          amount_cents: totalAmount,
          session_id: session.id?.slice(-16) || 'unknown',
          ip_hash: 'webhook',
          device_type: 'unknown',
        });

        // Accumulate spending for rewards tiers
        if (customerEmail && totalAmount > 0) {
          const email = customerEmail.toLowerCase();
          const { data: existing } = await supabase
            .from('user_spending')
            .select('total_spent_cents')
            .eq('email', email)
            .single();

          if (existing) {
            await supabase
              .from('user_spending')
              .update({
                total_spent_cents: existing.total_spent_cents + totalAmount,
                updated_at: new Date().toISOString(),
              })
              .eq('email', email);
          } else {
            await supabase
              .from('user_spending')
              .insert({
                email,
                total_spent_cents: totalAmount,
                updated_at: new Date().toISOString(),
              });
          }
        }
      }
    } catch (e) {
      console.error('Purchase analytics/spending error:', e);
    }

    // Return combined results
    if (printfulResult || printifyResult) {
      return {
        success: true,
        ...printfulResult,
        ...printifyResult,
      };
    } else {
      console.error('Could not match any items with Printful or Printify products');
      console.log('Line items:', JSON.stringify(merchItems, null, 2));
    }
  } catch (error) {
    console.error('Failed to create fulfillment order:', error);
    // Don't throw - we don't want to retry the webhook for fulfillment errors
    // The order is paid, we'll need to manually fulfill if this fails
  }
}

/**
 * Handle invoice.paid — auto-renewal success
 * Extends subscription for another 30 days
 */
async function handleInvoicePaid(invoice) {
  const customerEmail = invoice.customer_email;
  if (!customerEmail) {
    console.log('invoice.paid: No customer email, skipping');
    return;
  }

  const email = customerEmail.toLowerCase();
  console.log('Auto-renewal payment received for:', email);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Extend subscription
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update subscribers table
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      await supabase
        .from('subscribers')
        .update({
          status: 'active',
          free_until: thirtyDaysFromNow.toISOString(),
        })
        .eq('email', email);
    } else {
      await supabase.from('subscribers').insert({
        email,
        status: 'active',
        tier: 'regular',
        created_at: new Date().toISOString(),
        free_until: thirtyDaysFromNow.toISOString(),
      });
    }

    // Update user_trials table
    await supabase
      .from('user_trials')
      .upsert({
        email,
        stripe_sub_active: true,
        purchased_sub_until: thirtyDaysFromNow.toISOString(),
      }, { onConflict: 'email' });

    console.log('Subscription renewed for:', email, 'until', thirtyDaysFromNow.toISOString());
  } catch (err) {
    console.error('invoice.paid handler error:', err);
  }
}

/**
 * Handle customer.subscription.deleted — cancellation
 * Marks subscription as canceled in Supabase
 */
async function handleSubscriptionCanceled(subscription) {
  const customerEmail = subscription.metadata?.email;

  // Try to get email from customer object if not in metadata
  let email = customerEmail;
  if (!email) {
    console.log('subscription.deleted: No email in metadata, subscription:', subscription.id);
    return;
  }

  email = email.toLowerCase();
  console.log('Subscription canceled for:', email);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Mark as canceled in subscribers
    await supabase
      .from('subscribers')
      .update({ status: 'canceled' })
      .eq('email', email);

    // Mark stripe_sub_active = false in user_trials
    await supabase
      .from('user_trials')
      .update({ stripe_sub_active: false })
      .eq('email', email);

    console.log('Subscription marked canceled for:', email);
  } catch (err) {
    console.error('subscription.deleted handler error:', err);
  }
}

/**
 * Handle customer.subscription.updated — status changes (past_due, active, etc.)
 */
async function handleSubscriptionUpdated(subscription) {
  const customerEmail = subscription.metadata?.email;
  if (!customerEmail) return;

  const email = customerEmail.toLowerCase();
  const isActive = subscription.status === 'active';

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    await supabase
      .from('subscribers')
      .update({ status: isActive ? 'active' : subscription.status })
      .eq('email', email);

    await supabase
      .from('user_trials')
      .update({ stripe_sub_active: isActive })
      .eq('email', email);

    console.log('Subscription updated for:', email, '→', subscription.status);
  } catch (err) {
    console.error('subscription.updated handler error:', err);
  }
}
