import { printify } from '@/lib/printify';

export const dynamic = 'force-dynamic';

// Demo products returned when no API key is configured
const DEMO_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'MyStation Classic Tee',
    description: 'Premium cotton t-shirt with MyStation branding',
    images: [{ src: '/images/merch/tee-placeholder.png', is_default: true }],
    variants: [
      { id: 'v1', title: 'S / Black', price: 2499, is_enabled: true },
      { id: 'v2', title: 'M / Black', price: 2499, is_enabled: true },
      { id: 'v3', title: 'L / Black', price: 2499, is_enabled: true },
      { id: 'v4', title: 'XL / Black', price: 2499, is_enabled: true },
    ],
    tags: ['apparel', 'tee'],
    is_locked: false
  },
  {
    id: 'demo-2',
    title: 'MyStation Hoodie',
    description: 'Heavyweight pullover hoodie with embroidered logo',
    images: [{ src: '/images/merch/hoodie-placeholder.png', is_default: true }],
    variants: [
      { id: 'v5', title: 'S / Black', price: 4999, is_enabled: true },
      { id: 'v6', title: 'M / Black', price: 4999, is_enabled: true },
      { id: 'v7', title: 'L / Black', price: 4999, is_enabled: true },
      { id: 'v8', title: 'XL / Black', price: 4999, is_enabled: true },
    ],
    tags: ['apparel', 'hoodie'],
    is_locked: false
  },
  {
    id: 'demo-3',
    title: 'MyStation Snapback',
    description: 'Structured snapback cap with embroidered logo',
    images: [{ src: '/images/merch/cap-placeholder.png', is_default: true }],
    variants: [
      { id: 'v9', title: 'One Size / Black', price: 1999, is_enabled: true },
    ],
    tags: ['accessories', 'hat'],
    is_locked: false
  }
];

/**
 * GET /api/printify/products
 * Fetch all products from Printify shop
 */
export async function GET() {
  try {
    // Return demo data if no API key configured
    if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
      return Response.json({
        success: true,
        demo: true,
        count: DEMO_PRODUCTS.length,
        products: DEMO_PRODUCTS
      });
    }

    const allProducts = await printify.getStoreProducts();

    // Normalize the response shape
    const products = allProducts.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      images: (p.images || []).map(img => ({
        src: img.src,
        variant_ids: img.variant_ids,
        position: img.position,
        is_default: img.is_default
      })),
      variants: (p.variants || []).map(v => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        cost: v.cost,
        is_enabled: v.is_enabled
      })),
      tags: p.tags || [],
      created_at: p.created_at,
      updated_at: p.updated_at,
      is_locked: p.is_locked
    }));

    return Response.json({
      success: true,
      count: products.length,
      products
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('Printify products fetch error:', error);

    // Fallback to demo data on error so the storefront still renders
    return Response.json({
      success: true,
      demo: true,
      error: error.message,
      count: DEMO_PRODUCTS.length,
      products: DEMO_PRODUCTS
    });
  }
}

/**
 * POST /api/printify/products
 * Create a new product in Printify
 */
export async function POST(request) {
  try {
    if (!process.env.PRINTIFY_API_KEY || !process.env.PRINTIFY_SHOP_ID) {
      return Response.json(
        { success: false, error: 'Printify API key or Shop ID not configured' },
        { status: 503 }
      );
    }

    const productData = await request.json();

    // Validate required Printify product fields
    if (!productData.title || !productData.blueprint_id || !productData.print_provider_id || !productData.variants) {
      return Response.json(
        { success: false, error: 'Missing required fields: title, blueprint_id, print_provider_id, variants' },
        { status: 400 }
      );
    }

    const product = await printify.request(`/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });

    return Response.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Printify product creation error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
