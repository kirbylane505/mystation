import { printful } from '@/lib/printful';

/**
 * GET /api/printful/products/[id]
 * Fetch single product with all variants
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/printful/products/[id]
 * Delete a sync product
 */
export async function DELETE(request, { params }) {
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
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
