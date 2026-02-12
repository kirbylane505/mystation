import { printify } from '@/lib/printify';

export const dynamic = 'force-dynamic';

// Admin auth — header only
function isAuthorized(request) {
  const key = request.headers.get('x-admin-key');
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

/**
 * GET /api/printify/products/[id]
 * Fetch single product with all variants, images, and details
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
      return Response.json(
        { success: false, error: 'Printify API key or Shop ID not configured' },
        { status: 503 }
      );
    }

    const product = await printify.getStoreProduct(id);

    // Normalize response with full variant details
    const normalized = {
      id: product.id,
      title: product.title,
      description: product.description,
      blueprint_id: product.blueprint_id,
      print_provider_id: product.print_provider_id,
      images: (product.images || []).map(img => ({
        src: img.src,
        variant_ids: img.variant_ids,
        position: img.position,
        is_default: img.is_default
      })),
      variants: (product.variants || []).map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        // cost intentionally omitted — wholesale pricing is admin-only
        grams: v.grams,
        is_enabled: v.is_enabled,
        is_default: v.is_default,
        options: v.options || {}
      })),
      tags: product.tags || [],
      print_areas: product.print_areas || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
      visible: product.visible,
      is_locked: product.is_locked
    };

    return Response.json({
      success: true,
      product: normalized
    });
  } catch (error) {
    console.error('Printify product fetch error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/printify/products/[id]
 * Update a product (ADMIN ONLY)
 */
export async function PUT(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;

    if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
      return Response.json(
        { success: false, error: 'Printify API key or Shop ID not configured' },
        { status: 503 }
      );
    }

    const productData = await request.json();
    const product = await printify.request(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${id}.json`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });

    return Response.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Printify product update error:', error);
    return Response.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/printify/products/[id]
 * Delete a product (ADMIN ONLY)
 */
export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;

    if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
      return Response.json(
        { success: false, error: 'Printify API key or Shop ID not configured' },
        { status: 503 }
      );
    }

    await printify.request(`/shops/${process.env.PRINTIFY_SHOP_ID}/products/${id}.json`, {
      method: 'DELETE'
    });

    return Response.json({
      success: true,
      message: `Product ${id} deleted`
    });
  } catch (error) {
    console.error('Printify product delete error:', error);
    return Response.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
