import { sendShippingNotification, sendOrderFailedAlert } from '@/lib/email';
import { createHmac } from 'crypto';

/**
 * POST /api/printful/webhook
 * Handle Printful webhook events
 * Verifies webhook signature before processing
 *
 * Events: package_shipped, order_created, order_updated,
 *         order_failed, order_canceled, product_updated
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();

    // Verify Printful webhook signature (HMAC-SHA256)
    const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('x-printful-signature') || request.headers.get('webhook-signature') || '';
      const expectedSig = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      if (!signature || signature !== expectedSig) {
        console.error('[Printful Webhook] Invalid signature — rejecting');
        return Response.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Printful Webhook] PRINTFUL_WEBHOOK_SECRET not set — accepting without verification');
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    console.log(`[Printful Webhook] Event: ${type}`);

    switch (type) {
      case 'package_shipped':
        await handlePackageShipped(data);
        break;

      case 'order_created':
        await handleOrderCreated(data);
        break;

      case 'order_updated':
        await handleOrderUpdated(data);
        break;

      case 'order_failed':
        await handleOrderFailed(data);
        break;

      case 'order_canceled':
        await handleOrderCanceled(data);
        break;

      case 'product_updated':
        await handleProductUpdated(data);
        break;

      case 'product_deleted':
        await handleProductDeleted(data);
        break;

      case 'stock_updated':
        await handleStockUpdated(data);
        break;

      default:
        console.log(`[Printful Webhook] Unknown event type: ${type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('[Printful Webhook] Error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ============ EVENT HANDLERS ============

async function handlePackageShipped(data) {
  const { order, shipment } = data;

  console.log('[Printful] Package shipped:', {
    orderId: order.id,
    externalId: order.external_id,
    trackingNumber: shipment.tracking_number,
    trackingUrl: shipment.tracking_url,
    carrier: shipment.carrier,
    service: shipment.service
  });

  // Send shipping notification to customer
  sendShippingNotification({
    customerName: data?.order?.recipient?.name || '',
    customerEmail: data?.order?.recipient?.email || '',
    trackingNumber: data?.shipment?.tracking_number || '',
    trackingUrl: data?.shipment?.tracking_url || '',
    carrier: data?.shipment?.carrier || data?.shipment?.service || '',
    items: [],
  }).catch(err => console.error('Shipping email failed:', err));
}

async function handleOrderCreated(data) {
  const { order } = data;

  console.log('[Printful] Order created:', {
    orderId: order.id,
    externalId: order.external_id,
    status: order.status,
    costs: order.costs
  });
}

async function handleOrderUpdated(data) {
  const { order } = data;

  console.log('[Printful] Order updated:', {
    orderId: order.id,
    externalId: order.external_id,
    status: order.status
  });

  // TODO: Update order status in your database
}

async function handleOrderFailed(data) {
  const { order, reason } = data;

  console.error('[Printful] Order FAILED:', {
    orderId: order.id,
    externalId: order.external_id,
    reason
  });

  // Alert admin about failed order
  sendOrderFailedAlert({
    orderId: data?.order?.id || 'unknown',
    provider: 'Printful',
    error: data?.reason || 'Order fulfillment failed',
    customerEmail: data?.order?.recipient?.email || '',
  }).catch(err => console.error('Failed alert email failed:', err));
}

async function handleOrderCanceled(data) {
  const { order } = data;

  console.log('[Printful] Order canceled:', {
    orderId: order.id,
    externalId: order.external_id
  });

  // TODO: Process refund if needed
}

async function handleProductUpdated(data) {
  const { sync_product } = data;

  console.log('[Printful] Product updated:', {
    productId: sync_product.id,
    name: sync_product.name
  });

  // TODO: Sync product changes to your catalog
}

async function handleProductDeleted(data) {
  const { sync_product } = data;

  console.log('[Printful] Product deleted:', {
    productId: sync_product.id
  });

  // TODO: Remove from your catalog
}

async function handleStockUpdated(data) {
  console.log('[Printful] Stock updated:', data);

  // TODO: Update inventory display
}

/**
 * GET /api/printful/webhook
 * Return webhook configuration info
 */
export async function GET() {
  return Response.json({
    endpoint: '/api/printful/webhook',
    supported_events: [
      'package_shipped',
      'order_created',
      'order_updated',
      'order_failed',
      'order_canceled',
      'product_updated',
      'product_deleted',
      'stock_updated'
    ],
    status: 'active'
  });
}
