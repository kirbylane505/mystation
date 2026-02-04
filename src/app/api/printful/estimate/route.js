import { printful } from '@/lib/printful';

/**
 * POST /api/printful/estimate
 * Estimate order costs without creating an order
 */
export async function POST(request) {
  try {
    const { items, shipping } = await request.json();

    // Validate required fields
    if (!items || !items.length) {
      return Response.json(
        { success: false, error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!shipping || !shipping.zip) {
      return Response.json(
        { success: false, error: 'Missing shipping address' },
        { status: 400 }
      );
    }

    // Format order for estimation
    const orderData = {
      recipient: {
        address1: shipping.address1 || '',
        city: shipping.city || '',
        state_code: shipping.state || '',
        country_code: shipping.country || 'US',
        zip: shipping.zip
      },
      items: items.map(item => ({
        sync_variant_id: item.variantId,
        quantity: item.quantity || 1
      }))
    };

    const estimate = await printful.estimateOrderCosts(orderData);

    return Response.json({
      success: true,
      costs: estimate.costs,
      retailCosts: estimate.retail_costs
    });

  } catch (error) {
    console.error('[Estimate API] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
