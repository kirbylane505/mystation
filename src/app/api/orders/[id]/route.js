import { printful } from '@/lib/printful';

// Admin auth check
function isAuthorized(request) {
  const key = request.headers.get('x-admin-key') || new URL(request.url).searchParams.get('key');
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

/**
 * GET /api/orders/[id]
 * Get single order details (admin only)
 */
export async function GET(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = params;

    const order = await printful.getOrder(id);

    return Response.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('[Orders API] Get order error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders/[id]
 * Confirm a draft order for fulfillment
 */
export async function POST(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = params;

    const order = await printful.confirmOrder(id);

    console.log('[Orders API] Order confirmed:', {
      orderId: order.id,
      status: order.status
    });

    return Response.json({
      success: true,
      message: 'Order confirmed for fulfillment',
      order
    });
  } catch (error) {
    console.error('[Orders API] Confirm order error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orders/[id]
 * Cancel an order
 */
export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = params;

    await printful.cancelOrder(id);

    console.log('[Orders API] Order canceled:', id);

    return Response.json({
      success: true,
      message: `Order ${id} canceled`
    });
  } catch (error) {
    console.error('[Orders API] Cancel order error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
