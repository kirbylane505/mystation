import { printful } from '@/lib/printful';

// US state name → abbreviation
const STATE_ABBREVS = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD',
  'massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS','missouri':'MO',
  'montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH','new jersey':'NJ',
  'new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND','ohio':'OH',
  'oklahoma':'OK','oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI','wyoming':'WY',
  'district of columbia':'DC','puerto rico':'PR','guam':'GU','virgin islands':'VI',
  'american samoa':'AS','northern mariana islands':'MP'
};
function toStateCode(s) { if (!s) return ''; if (s.length === 2) return s.toUpperCase(); return STATE_ABBREVS[s.toLowerCase()] || s; }

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
      state_code: toStateCode(address.state),
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
