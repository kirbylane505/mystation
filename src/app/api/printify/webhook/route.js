export const dynamic = 'force-dynamic';

import { sendShippingNotification, sendOrderFailedAlert, sendOrderStatusUpdate, sendDeliveryConfirmation, sendOrderConfirmation } from '@/lib/email';
import { createHmac } from 'crypto';

/**
 * POST /api/printify/webhook
 * Handle Printify webhook events — signature verified
 *
 * Supported events:
 * - order:created               New order placed
 * - order:updated               Order details changed
 * - order:sent-to-production    Order sent to print provider
 * - order:shipment:created      Shipment created with tracking info
 * - order:shipment:delivered    Package delivered
 * - product:publish:started     Product publishing initiated
 * - product:publish:succeeded   Product published successfully
 * - product:publish:failed      Product publishing failed
 *
 * Printify webhook payload: { type: string, resource: object }
 * Register at: POST https://api.printify.com/v1/shops/{shop_id}/webhooks.json
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();

    // Verify Printify webhook signature
    const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-printify-signature') || request.headers.get('webhook-signature') || '';
      const expectedSig = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (!signature || signature !== expectedSig) {
        console.error('[Printify Webhook] Invalid signature — rejecting');
        return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Printify Webhook] PRINTIFY_WEBHOOK_SECRET not set — accepting without verification');
    }

    const payload = JSON.parse(rawBody);
    const { type, resource } = payload;

    console.log(`[Printify Webhook] Event: ${type}`);

    switch (type) {
      // ============ ORDER EVENTS ============

      case 'order:created': {
        const { id, status, line_items } = resource;
        console.log(`[Printify Webhook] Order created: ${id}, status: ${status}, items: ${line_items?.length || 0}`);

        // Send order confirmation to customer
        const customerEmail = resource?.address_to?.email;
        const customerName = `${resource?.address_to?.first_name || ''} ${resource?.address_to?.last_name || ''}`.trim();
        if (customerEmail) {
          sendOrderConfirmation({
            customerName: customerName || 'Customer',
            customerEmail,
            items: (line_items || []).map(li => ({
              name: li.title || li.metadata?.title || 'Merch Item',
              quantity: li.quantity || 1,
              amount: Math.round((li.price || 0)),
            })),
            total: (line_items || []).reduce((sum, li) => sum + (li.price || 0) * (li.quantity || 1), 0),
            sessionId: id,
          }).catch(err => console.error('Order confirmation email failed:', err));
        }

        break;
      }

      case 'order:updated': {
        const { id, status } = resource;
        console.log(`[Printify Webhook] Order updated: ${id} -> ${status}`);

        // Notify customer of status change
        const email = resource?.address_to?.email;
        if (email && status) {
          sendOrderStatusUpdate({
            customerName: `${resource?.address_to?.first_name || ''} ${resource?.address_to?.last_name || ''}`.trim(),
            customerEmail: email,
            orderId: id,
            provider: 'Printify',
            status,
            message: `Your order is now: ${status.replace(/_/g, ' ')}`,
          }).catch(err => console.error('Status update email failed:', err));
        }

        break;
      }

      case 'order:sent-to-production': {
        const { id } = resource;
        console.log(`[Printify Webhook] Order sent to production: ${id}`);

        // Notify customer their order is being printed
        const prodEmail = resource?.address_to?.email;
        if (prodEmail) {
          sendOrderStatusUpdate({
            customerName: `${resource?.address_to?.first_name || ''} ${resource?.address_to?.last_name || ''}`.trim(),
            customerEmail: prodEmail,
            orderId: id,
            provider: 'Printify',
            status: 'in_production',
            message: 'Great news! Your order is now being printed. You\'ll receive tracking info once it ships.',
          }).catch(err => console.error('Production status email failed:', err));
        }

        break;
      }

      case 'order:shipment:created': {
        const { id, shipments } = resource;
        const shipment = shipments?.[0];

        console.log(`[Printify Webhook] Shipment created for order: ${id}`);
        if (shipment) {
          console.log(`  Carrier: ${shipment.carrier}`);
          console.log(`  Tracking: ${shipment.number}`);
          console.log(`  URL: ${shipment.url}`);
        }

        // Send shipping notification with tracking link to customer
        sendShippingNotification({
          customerName: `${resource?.address_to?.first_name || ''} ${resource?.address_to?.last_name || ''}`.trim(),
          customerEmail: resource?.address_to?.email || '',
          trackingNumber: shipment?.number || shipment?.tracking_number || '',
          trackingUrl: shipment?.url || shipment?.tracking_url || '',
          carrier: shipment?.carrier || '',
          items: [],
        }).catch(err => console.error('Shipping email failed:', err));

        break;
      }

      case 'order:shipment:delivered': {
        const { id } = resource;
        console.log(`[Printify Webhook] Order delivered: ${id}`);

        // Send delivery confirmation + review request
        const deliveryEmail = resource?.address_to?.email;
        if (deliveryEmail) {
          sendDeliveryConfirmation({
            customerName: `${resource?.address_to?.first_name || ''} ${resource?.address_to?.last_name || ''}`.trim(),
            customerEmail: deliveryEmail,
            orderId: id,
          }).catch(err => console.error('Delivery confirmation email failed:', err));
        }

        break;
      }

      // ============ PRODUCT EVENTS ============

      case 'product:publish:started': {
        const { id, title } = resource;
        console.log(`[Printify Webhook] Product publishing started: ${title} (${id})`);
        break;
      }

      case 'product:publish:succeeded': {
        const { id, title } = resource;
        console.log(`[Printify Webhook] Product published: ${title} (${id})`);

        // Products are fetched live from Printify API — publish auto-reflected
        // Log for audit trail
        break;
      }

      case 'product:publish:failed': {
        const { id, title } = resource;
        console.error(`[Printify Webhook] Product publish FAILED: ${title} (${id})`);

        // Alert admin about failed publish
        sendOrderFailedAlert({
          orderId: id,
          provider: 'Printify',
          error: `Product publish failed: ${title}`,
          customerEmail: null,
        }).catch(err => console.error('Publish failure alert email failed:', err));

        break;
      }

      default:
        console.log(`[Printify Webhook] Unhandled event type: ${type}`);
    }

    // Always respond 200 to acknowledge receipt
    return Response.json({ received: true, type });
  } catch (error) {
    console.error('[Printify Webhook] Processing error:', error);

    // Alert admin about webhook processing failure
    sendOrderFailedAlert({
      orderId: 'webhook-error',
      provider: 'Printify',
      error: `Webhook processing error: ${error.message}`,
      customerEmail: null,
    }).catch(err => console.error('Webhook error alert email failed:', err));

    // Still return 200 to prevent Printify from retrying on parse errors
    return Response.json(
      { received: true, error: error.message },
      { status: 200 }
    );
  }
}

/**
 * GET /api/printify/webhook
 * Health check / verification endpoint
 */
export async function GET() {
  return Response.json({
    status: 'active',
    service: 'printify-webhook',
    events: [
      'order:created',
      'order:updated',
      'order:sent-to-production',
      'order:shipment:created',
      'order:shipment:delivered',
      'product:publish:started',
      'product:publish:succeeded',
      'product:publish:failed'
    ]
  });
}
