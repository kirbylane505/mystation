import { printful } from '@/lib/printful';

export const dynamic = 'force-dynamic';

// Admin auth — header only
function isAuthorized(request) {
  const key = request.headers.get('x-admin-key');
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

/**
 * GET /api/printful/products
 * Fetch all synced products from Printful store (public — no cost data)
 */
export async function GET() {
  try {
    const products = await printful.getStoreProducts();

    return Response.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Printful products fetch error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/printful/products
 * Create a new sync product in Printful (ADMIN ONLY)
 */
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const productData = await request.json();

    // Validate required fields
    if (!productData.sync_product || !productData.sync_variants) {
      return Response.json(
        { success: false, error: 'Missing sync_product or sync_variants' },
        { status: 400 }
      );
    }

    const product = await printful.createStoreProduct(productData);

    return Response.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Printful product creation error:', error);
    return Response.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
