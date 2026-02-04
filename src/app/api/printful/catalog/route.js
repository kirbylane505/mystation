import { printful } from '@/lib/printful';

export const dynamic = 'force-dynamic';

/**
 * GET /api/printful/catalog
 * Browse Printful product catalog (all available products to create)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    // Get single catalog product with variants
    if (productId) {
      const product = await printful.getCatalogProduct(productId);
      return Response.json({
        success: true,
        product
      });
    }

    // Get all catalog products
    const products = await printful.getCatalogProducts();

    return Response.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error('[Catalog API] Error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
