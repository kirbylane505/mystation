import { printful } from '@/lib/printful';

/**
 * POST /api/shipping
 * Calculate shipping rates for items to an address
 */
export async function POST(request) {
  try {
    const { address, items } = await request.json();

    // Validate required fields
    if (!address || !address.zip) {
      return Response.json(
        { success: false, error: 'Missing shipping address' },
        { status: 400 }
      );
    }

    if (!items || !items.length) {
      return Response.json(
        { success: false, error: 'No items provided' },
        { status: 400 }
      );
    }

    // Format recipient for Printful
    const recipient = {
      address1: address.address1 || '',
      city: address.city || '',
      state_code: address.state || '',
      country_code: address.country || 'US',
      zip: address.zip
    };

    // Format items for Printful
    const formattedItems = items.map(item => ({
      sync_variant_id: item.variantId,
      quantity: item.quantity || 1
    }));

    const rates = await printful.getShippingRates(recipient, formattedItems);

    return Response.json({
      success: true,
      rates: rates.map(rate => ({
        id: rate.id,
        name: rate.name,
        rate: rate.rate,
        currency: rate.currency,
        minDeliveryDays: rate.minDeliveryDays,
        maxDeliveryDays: rate.maxDeliveryDays
      }))
    });

  } catch (error) {
    console.error('[Shipping API] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
