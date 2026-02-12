import { printful } from '@/lib/printful';

export const dynamic = 'force-dynamic';

// Admin auth — header only
function isAuthorized(request) {
  const key = request.headers.get('x-admin-key');
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY;
}

/**
 * GET /api/printful/products/[id]
 * Fetch single product with all variants (public — no cost data)
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const product = await printful.getStoreProduct(id);

    return Response.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Printful product fetch error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/printful/products/[id]
 * Delete a sync product (ADMIN ONLY)
 */
export async function DELETE(request, { params }) {
  if (!isAuthorized(request)) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = params;

    await printful.deleteStoreProduct(id);

    return Response.json({
      success: true,
      message: `Product ${id} deleted`
    });
  } catch (error) {
    console.error('Printful product delete error:', error);
    return Response.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
