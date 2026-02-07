import { printful } from '@/lib/printful';

export const dynamic = 'force-dynamic';

/**
 * GET /api/printful/products
 * Fetch all synced products from Printful store
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/printful/products
 * Create a new sync product in Printful
 */
export async function POST(request) {
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
