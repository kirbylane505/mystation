export const dynamic = 'force-dynamic';

import { sendShippingNotification, sendOrderFailedAlert } from '@/lib/email';

/**
 * POST /api/printify/webhook
 * Handle Printify webhook events
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
    const payload = await request.json();
    const { type, resource } = payload;

    console.log(`[Printify Webhook] Event: ${type}`, JSON.stringify(resource, null, 2));

    switch (type) {
      // ============ ORDER EVENTS ============

      case 'order:created': {
        const { id, status, line_items, address_to, total_price } = resource;
        console.log(`[Printify Webhook] Order created: ${id}`);
        console.log(`  Status: ${status}`);
        console.log(`  Items: ${line_items?.length || 0}`);
        console.log(`  Ship to: ${address_to?.city}, ${address_to?.region} ${address_to?.zip}`);
        console.log(`  Total: $${(total_price / 100).toFixed(2)}`);

        // TODO: Store order in database
        // TODO: Send order confirmation email to customer
        // TODO: Update inventory/dashboard

        break;
      }

      case 'order:updated': {
        const { id, status } = resource;
        console.log(`[Printify Webhook] Order updated: ${id} -> ${status}`);

        // TODO: Update order status in database
        // TODO: Notify customer of status change if significant

        break;
      }

      case 'order:sent-to-production': {
        const { id } = resource;
        console.log(`[Printify Webhook] Order sent to production: ${id}`);

        // TODO: Update order status in database
        // TODO: Notify customer that order is being produced

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

        // TODO: Store tracking info in database

        // Send shipping notification with tracking link to customer
        sendShippingNotification({
          customerName: resource?.address_to?.first_name + ' ' + (resource?.address_to?.last_name || ''),
          customerEmail: resource?.address_to?.email || '',
          trackingNumber: resource?.shipments?.[0]?.tracking_number || shipment?.tracking?.number || '',
          trackingUrl: resource?.shipments?.[0]?.tracking_url || shipment?.tracking?.url || '',
          carrier: resource?.shipments?.[0]?.carrier || shipment?.carrier || '',
          items: [],
        }).catch(err => console.error('Shipping email failed:', err));

        break;
      }

      case 'order:shipment:delivered': {
        const { id } = resource;
        console.log(`[Printify Webhook] Order delivered: ${id}`);

        // TODO: Update order status to delivered in database
        // TODO: Send delivery confirmation email
        // TODO: Trigger review request after delay

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

        // TODO: Update product status in local database
        // TODO: Invalidate product cache

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
