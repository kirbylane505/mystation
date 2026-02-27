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
import { sendSaleAlert, sendOrderConfirmation, sendNewSignupAlert, sendCancelAlert, sendBigSpenderThankYou, sendOrderFailedAlert } from '@/lib/email';
import { tagSubscriber } from '@/lib/kit';
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  // Skip MyTicketsLive checkout sessions — they have their own webhook
  const meta = session.metadata || {};
  if (meta.eventSlug || meta.orderNumber?.startsWith('MTIX-') || meta.type === 'bundle' || meta.bundle_slug) {
    console.log('Skipping MyTicketsLive session:', session.id);
    return;
  }

  // --- SUBSCRIPTION CHECKOUT ---
  // If mode is 'subscription', handle subscriber registration (NOT merch)
  if (session.mode === 'subscription') {
    await handleSubscriptionCheckout(session, stripe);
    return;
  }

  try {
    // Get full session with line items
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product', 'customer_details'],
    });

    // Extract shipping address (may be null for some checkouts)
    const shipping = fullSession.shipping_details || fullSession.customer_details;
    const hasShipping = shipping && shipping.address;
    if (!hasShipping) {
      console.warn('No shipping address found in session — emails will still be sent');
    }

    // Check if this is a merch order (not subscription)
    const lineItems = fullSession.line_items?.data || [];
    const merchItems = lineItems.filter(item => {
      // Filter out subscriptions - only physical products
      return item.price?.type !== 'recurring';
    });

    if (merchItems.length === 0) {
      console.log('No merch items in order - checking for subscription');

      // If this is a subscription checkout, register the subscriber
      const subItems = lineItems.filter(item => item.price?.type === 'recurring');
      if (subItems.length > 0) {
        const customerEmail = fullSession.customer_details?.email || session.customer_email;
        if (customerEmail) {
          await registerNewSubscriber(customerEmail, subItems[0]?.price?.unit_amount || 0);
        }
      }
      return;
    }

    // Get order metadata
    const metadata = session.metadata || {};
    const customerEmail = fullSession.customer_details?.email || session.customer_email;
    const customerName = shipping?.name || fullSession.customer_details?.name || 'Customer';
    const totalAmount = fullSession.amount_total || 0;

    // Parse print provider items from metadata
    let parsedPrintfulItems = null;
    let parsedPrintifyItems = null;
    try { if (metadata.printful_items) parsedPrintfulItems = JSON.parse(metadata.printful_items); } catch (e) { console.error('Failed to parse printful_items:', e); }
    try { if (metadata.printify_items) parsedPrintifyItems = JSON.parse(metadata.printify_items); } catch (e) { console.error('Failed to parse printify_items:', e); }

    // ========================================
    // ORDER TRACKING — Log to merch_orders
    // ========================================
    let orderRecordId = null;
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: orderRecord } = await supabase.from('merch_orders').insert({
          stripe_session_id: session.id,
          customer_email: customerEmail || 'unknown',
          customer_name: customerName,
          items: merchItems.map(i => ({ name: i.description || i.price?.product?.name, quantity: i.quantity, amount: i.amount_total })),
          shipping_address: shipping?.address || null,
          total_cents: totalAmount,
          printful_items: parsedPrintfulItems,
          printify_items: parsedPrintifyItems,
          printful_status: parsedPrintfulItems ? 'pending' : 'none',
          printify_status: parsedPrintifyItems ? 'pending' : 'none',
          status: 'pending',
        }).select('id').single();
        orderRecordId = orderRecord?.id;
        console.log('Order logged to merch_orders:', orderRecordId);
      }
    } catch (e) {
      console.error('Failed to log order to merch_orders (non-blocking):', e.message);
    }

    // Helper to update order record
    async function updateOrderRecord(updates) {
      if (!orderRecordId) return;
      try {
        const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase.from('merch_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', orderRecordId);
        }
      } catch (e) { console.error('Failed to update merch_orders:', e.message); }
    }

    // Build email items list (used by both success and fail alerts)
    const itemsForEmail = merchItems.map(item => ({
      name: item.description || item.price?.product?.name || 'Merch Item',
      quantity: item.quantity,
      amount: item.amount_total || item.price?.unit_amount * item.quantity || 0,
    }));

    // ========================================
    // PRINTFUL ORDER — with retry + fail alert
    // ========================================
    let printfulResult = null;
    if (parsedPrintfulItems && parsedPrintfulItems.length > 0 && hasShipping) {
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
          email: customerEmail,
          phone: fullSession.customer_details?.phone || '',
        },
        items: parsedPrintfulItems.map(item => ({
          sync_variant_id: item.sync_variant_id,
          quantity: item.quantity,
        })),
      };

      // Try up to 2 times
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Creating Printful order (attempt ${attempt}):`, JSON.stringify(printfulOrder, null, 2));
          const order = await printful.createOrder(printfulOrder, true);
          console.log('Printful order created:', order.id, 'status:', order.status);
          printfulResult = { printfulOrderId: order.id, status: order.status };
          await updateOrderRecord({ printful_order_id: String(order.id), printful_status: order.status || 'created' });
          break; // Success — exit retry loop
        } catch (e) {
          console.error(`Printful order attempt ${attempt} failed:`, e.message);
          if (attempt === 2) {
            // FINAL FAILURE — alert Mike
            const errorMsg = e.message || 'Unknown Printful error';
            await updateOrderRecord({ printful_status: 'failed', printful_error: errorMsg });
            sendOrderFailedAlert({
              provider: 'Printful',
              error: errorMsg,
              customerName, customerEmail,
              items: itemsForEmail,
              total: totalAmount,
              shippingAddress: shipping?.address,
              stripeSessionId: session.id,
              printfulItems: parsedPrintfulItems,
            }).catch(err => console.error('Printful fail alert email error:', err));
          } else {
            // Wait 2 seconds before retry
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
    } else if (parsedPrintfulItems && !hasShipping) {
      // Has Printful items but no shipping — alert
      sendOrderFailedAlert({
        provider: 'Printful',
        error: 'No shipping address provided — cannot create print order',
        customerName, customerEmail,
        items: itemsForEmail,
        total: totalAmount,
        shippingAddress: null,
        stripeSessionId: session.id,
        printfulItems: parsedPrintfulItems,
      }).catch(err => console.error('Printful no-shipping alert error:', err));
      await updateOrderRecord({ printful_status: 'failed', printful_error: 'No shipping address' });
    }

    // ========================================
    // PRINTIFY ORDER — with retry + fail alert
    // ========================================
    let printifyResult = null;
    if (parsedPrintifyItems && parsedPrintifyItems.length > 0 && hasShipping) {
      const printifyOrder = {
        external_id: session.id,
        label: `MyStation Order ${session.id.slice(-8)}`,
        line_items: parsedPrintifyItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shipping_method: 1,
        send_shipping_notification: true,
        address_to: {
          first_name: (shipping.name || '').split(' ')[0] || 'Customer',
          last_name: (shipping.name || '').split(' ').slice(1).join(' ') || '',
          email: customerEmail || '',
          phone: fullSession.customer_details?.phone || '',
          country: shipping.address.country || 'US',
          region: shipping.address.state || '',
          address1: shipping.address.line1 || '',
          address2: shipping.address.line2 || '',
          city: shipping.address.city || '',
          zip: shipping.address.postal_code || '',
        },
      };

      // Try up to 2 times
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Creating Printify order (attempt ${attempt}):`, JSON.stringify(printifyOrder, null, 2));
          const order = await printify.createOrder(printifyOrder, true);
          console.log('Printify order created:', order.id);
          printifyResult = { printifyOrderId: order.id, sent_to_production: order.sent_to_production };
          await updateOrderRecord({ printify_order_id: order.id, printify_status: 'created' });
          break; // Success
        } catch (e) {
          console.error(`Printify order attempt ${attempt} failed:`, e.message);
          if (attempt === 2) {
            const errorMsg = e.message || 'Unknown Printify error';
            await updateOrderRecord({ printify_status: 'failed', printify_error: errorMsg });
            sendOrderFailedAlert({
              provider: 'Printify',
              error: errorMsg,
              customerName, customerEmail,
              items: itemsForEmail,
              total: totalAmount,
              shippingAddress: shipping?.address,
              stripeSessionId: session.id,
              printifyItems: parsedPrintifyItems,
            }).catch(err => console.error('Printify fail alert email error:', err));
          } else {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
    } else if (parsedPrintifyItems && !hasShipping) {
      sendOrderFailedAlert({
        provider: 'Printify',
        error: 'No shipping address provided — cannot create print order',
        customerName, customerEmail,
        items: itemsForEmail,
        total: totalAmount,
        shippingAddress: null,
        stripeSessionId: session.id,
        printifyItems: parsedPrintifyItems,
      }).catch(err => console.error('Printify no-shipping alert error:', err));
      await updateOrderRecord({ printify_status: 'failed', printify_error: 'No shipping address' });
    }

    // Update overall order status
    const overallStatus = (!parsedPrintfulItems || printfulResult) && (!parsedPrintifyItems || printifyResult)
      ? 'fulfilled'
      : (printfulResult || printifyResult) ? 'partial' : 'failed';
    await updateOrderRecord({ status: overallStatus });

    // ========================================
    // EMAILS — ALWAYS fire, no matter what
    // ERR-0034: NEVER return/skip before this
    // ========================================

    // Admin sale alert
    sendSaleAlert({
      customerName,
      customerEmail,
      items: itemsForEmail,
      total: totalAmount,
      shippingAddress: shipping?.address || null,
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

    // $100+ VIP thank you email
    if (customerEmail && totalAmount >= 10000) {
      sendBigSpenderThankYou({
        customerName,
        customerEmail,
        total: totalAmount,
        items: itemsForEmail,
      }).catch(err => console.error('Big spender thank you email failed:', err));
    }

    // Tag as merch buyer in Kit (fire-and-forget)
    if (customerEmail) {
      tagSubscriber(customerEmail, 'merch-buyer').catch(err =>
        console.error('Kit tag error (merch-buyer):', err)
      );
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
 * Handle subscription checkout — store Stripe IDs, register subscriber
 * Called when session.mode === 'subscription' (NOT merch orders)
 */
async function handleSubscriptionCheckout(session, stripe) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  if (!customerEmail) {
    console.log('Subscription checkout: no email found');
    return;
  }

  const email = customerEmail.toLowerCase();
  const tier = session.metadata?.tier || 'supporter';
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  console.log(`New subscription: ${email} → ${tier} (customer: ${customerId}, sub: ${subscriptionId})`);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Get subscription details for period end
    let currentPeriodEnd = null;
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        if (sub.current_period_end) {
          currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
        }
      } catch (subErr) {
        console.warn('Could not retrieve subscription details:', subErr.message);
      }
    }

    // Count for subscriber number
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });
    const subscriberNumber = (count || 0) + 1;

    // Upsert subscriber with Stripe IDs (handles both pre- and post-migration schema)
    const fullRow = {
      email,
      status: 'active',
      tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      subscriber_number: subscriberNumber,
      created_at: new Date().toISOString(),
    };
    const { error: upsertErr } = await supabase.from('subscribers').upsert(fullRow, { onConflict: 'email' });
    if (upsertErr) {
      // Columns may not exist yet — fall back to base columns only
      console.warn('Full upsert failed (migration pending?), falling back:', upsertErr.message);
      await supabase.from('subscribers').upsert({
        email, status: 'active', tier,
        subscriber_number: subscriberNumber,
        created_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }

    // Also update user_trials
    await supabase.from('user_trials').upsert({
      email,
      stripe_sub_active: true,
      purchased_sub_until: currentPeriodEnd,
    }, { onConflict: 'email' });

    // Alert Mike + tag in Kit
    sendNewSignupAlert({
      customerName: session.customer_details?.name || email.split('@')[0],
      customerEmail: email,
      subscriberNumber,
      isFreeSlot: subscriberNumber <= 250,
    }).catch(() => {});

    tagSubscriber(email, `subscriber-${tier}`).catch(() => {});

  } catch (err) {
    console.error('Subscription checkout handler error:', err);
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

    // Detect tier from invoice amount (in cents)
    const amountPaid = invoice.amount_paid || 0;
    let tier = 'regular';
    if (amountPaid >= 1499) tier = 'diamond';
    else if (amountPaid >= 999) tier = 'premium';

    // Extend subscription
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update subscribers table
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, tier')
      .eq('email', email)
      .single();

    if (existing) {
      // Only upgrade tier, never downgrade (they might have been manually upgraded)
      const tierRank = { free: 0, regular: 1, supporter: 1, premium: 2, diamond: 3 };
      const newTier = (tierRank[tier] || 0) >= (tierRank[existing.tier] || 0) ? tier : existing.tier;
      await supabase
        .from('subscribers')
        .update({
          status: 'active',
          tier: newTier,
          free_until: thirtyDaysFromNow.toISOString(),
        })
        .eq('email', email);
    } else {
      await supabase.from('subscribers').insert({
        email,
        status: 'active',
        tier,
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

    // Alert Mike about new/renewed subscriber
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    sendNewSignupAlert({
      customerName: invoice.customer_name || email.split('@')[0],
      customerEmail: email,
      subscriberNumber: count || 1,
      isFreeSlot: false,
    }).catch(() => {});

  } catch (err) {
    console.error('invoice.paid handler error:', err);
  }
}

/**
 * Handle customer.subscription.deleted — cancellation
 * Marks subscription as canceled in Supabase
 */
async function handleSubscriptionCanceled(subscription) {
  console.log('Subscription canceled:', subscription.id);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Find by stripe_subscription_id first, fall back to metadata email
    let email;
    const { data: subscriber, error: lookupErr } = await supabase
      .from('subscribers')
      .select('email')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    email = (!lookupErr && subscriber?.email) ? subscriber.email : subscription.metadata?.email;
    if (!email) {
      console.log('subscription.deleted: Cannot find subscriber for:', subscription.id);
      return;
    }

    email = email.toLowerCase();
    console.log('Subscription canceled for:', email);

    const { error: cancelErr } = await supabase
      .from('subscribers')
      .update({ status: 'canceled', cancel_at_period_end: false })
      .eq('email', email);
    if (cancelErr) {
      // cancel_at_period_end column may not exist yet
      await supabase
        .from('subscribers')
        .update({ status: 'canceled' })
        .eq('email', email);
    }

    await supabase
      .from('user_trials')
      .update({ stripe_sub_active: false })
      .eq('email', email);

    sendCancelAlert({ customerEmail: email, reason: 'Subscription canceled' }).catch(() => {});

  } catch (err) {
    console.error('subscription.deleted handler error:', err);
  }
}

/**
 * Register a new subscriber in Supabase when they first checkout
 * This keeps the founding member counter accurate in real-time
 */
async function registerNewSubscriber(customerEmail, amountCents) {
  const email = customerEmail.toLowerCase();
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Check if already in subscribers table
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('Subscriber already exists:', email);
      return;
    }

    // Detect tier from amount
    let tier = 'supporter';
    if (amountCents >= 1499) tier = 'diamond';
    else if (amountCents >= 999) tier = 'premium';

    // Get next subscriber number
    const { count } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    const subscriberNumber = (count || 0) + 1;
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from('subscribers').insert({
      email,
      status: 'active',
      tier,
      subscriber_number: subscriberNumber,
      created_at: new Date().toISOString(),
      free_until: thirtyDays.toISOString(),
    });

    console.log(`New subscriber registered: ${email} (#${subscriberNumber}, ${tier})`);

    // Alert Mike
    sendNewSignupAlert({
      customerName: email.split('@')[0],
      customerEmail: email,
      subscriberNumber,
      isFreeSlot: subscriberNumber <= 250,
    }).catch((err) => console.error('Signup alert email failed:', err));

  } catch (err) {
    console.error('registerNewSubscriber error:', err);
  }
}

/**
 * Handle customer.subscription.updated — status changes (past_due, active, etc.)
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id, 'status:', subscription.status);

  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin');
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    // Find subscriber by stripe_subscription_id (may not exist pre-migration)
    let subscriber = null;
    const { data: subById, error: subByIdErr } = await supabase
      .from('subscribers')
      .select('email, tier')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!subByIdErr && subById) {
      subscriber = subById;
    } else {
      // Fall back to metadata email (for legacy or pre-migration subscriptions)
      const metaEmail = subscription.metadata?.email;
      if (!metaEmail) {
        console.log('subscription.updated: No subscriber found for sub:', subscription.id);
        return;
      }
      // Update by email instead
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      await supabase
        .from('subscribers')
        .update({ status: isActive ? 'active' : subscription.status })
        .eq('email', metaEmail.toLowerCase());
      return;
    }

    // Detect new tier from price
    const { tierFromPriceId } = await import('@/lib/tiers');
    const priceId = subscription.items?.data?.[0]?.price?.id;
    const newTier = priceId ? tierFromPriceId(priceId) : subscriber.tier;
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';

    // Try full update with new columns, fall back to base columns
    const fullUpdate = {
      tier: newTier,
      status: isActive ? 'active' : subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
    };
    const { error: updateErr } = await supabase
      .from('subscribers')
      .update(fullUpdate)
      .eq('stripe_subscription_id', subscription.id);
    if (updateErr) {
      // Columns may not exist yet — fall back to base update
      await supabase
        .from('subscribers')
        .update({ tier: newTier, status: isActive ? 'active' : subscription.status })
        .eq('email', subscriber.email);
    }

    await supabase
      .from('user_trials')
      .update({ stripe_sub_active: isActive })
      .eq('email', subscriber.email);

    if (newTier !== subscriber.tier) {
      console.log(`Tier changed: ${subscriber.email} ${subscriber.tier} → ${newTier}`);
    }

    if (!isActive) {
      sendCancelAlert({
        customerEmail: subscriber.email,
        reason: `Status changed to: ${subscription.status}`,
      }).catch(() => {});
    }

  } catch (err) {
    console.error('subscription.updated handler error:', err);
  }
}
