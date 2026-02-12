import { printful } from '@/lib/printful';

export const dynamic = 'force-dynamic';

// Admin auth check — protects order creation and listing
function isAuthorized(request) {
  const key = request.headers.get('x-admin-key') || new URL(request.url).searchParams.get('key');
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

/**
 * POST /api/orders
 * Create a new order in Printful (admin only — webhook handles customer orders)
 */
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { items, shipping, customer, confirm = false } = await request.json();

    // Validate required fields
    if (!items || !items.length) {
      return Response.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      );
    }

    if (!shipping || !shipping.name || !shipping.address1 || !shipping.city || !shipping.zip) {
      return Response.json(
        { success: false, error: 'Missing shipping information' },
        { status: 400 }
      );
    }

    if (!customer || !customer.email) {
      return Response.json(
        { success: false, error: 'Missing customer email' },
        { status: 400 }
      );
    }

    // Generate unique external ID
    const externalId = `mystation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Format order for Printful
    const orderData = {
      external_id: externalId,
      recipient: {
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || '',
        city: shipping.city,
        state_code: shipping.state || '',
        country_code: shipping.country || 'US',
        zip: shipping.zip,
        email: customer.email,
        phone: customer.phone || ''
      },
      items: items.map(item => ({
        sync_variant_id: item.variantId,
        quantity: item.quantity || 1,
        // Include retail price for packing slip
        retail_price: item.price ? item.price.toString() : undefined
      }))
    };

    // Add gift message if provided
    if (shipping.giftMessage) {
      orderData.gift = {
        subject: 'Your MyStation Order',
        message: shipping.giftMessage
      };
    }

    // Create order (draft or confirmed based on param)
    const order = await printful.createOrder(orderData, confirm);

    console.log('[Orders API] Order created:', {
      printfulId: order.id,
      externalId: order.external_id,
      status: order.status,
      confirm
    });

    return Response.json({
      success: true,
      order: {
        id: order.id,
        externalId: order.external_id,
        status: order.status,
        costs: order.costs,
        retailCosts: order.retail_costs,
        items: order.items.length
      }
    });

  } catch (error) {
    console.error('[Orders API] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * Get all orders or single order by ID
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const externalId = searchParams.get('external_id');
    const status = searchParams.get('status');

    // Get single order by Printful ID
    if (orderId) {
      const order = await printful.getOrder(orderId);
      return Response.json({ success: true, order });
    }

    // Get single order by external ID
    if (externalId) {
      const order = await printful.getOrderByExternalId(externalId);
      return Response.json({ success: true, order });
    }

    // Get all orders (optionally filtered by status)
    const orders = await printful.getOrders(status);

    return Response.json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error('[Orders API] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
