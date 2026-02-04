/**
 * Setup Printful Products for MyStation/IDMG
 * Run: node scripts/setup-printful-products.js
 */

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || 'NWhjLwpO04XKjfyKPBCyKFmVqGup1mKRLAphbfS7';
const PRINTFUL_API = 'https://api.printful.com';

// Design file URLs (must be publicly accessible)
const DESIGNS = {
  idmg: 'https://mystation.vercel.app/images/idmg-logo-white.png',
  lotl: 'https://mystation.vercel.app/images/lotl-logo-2026.png',
  mpf: 'https://mystation.vercel.app/images/mpf-logo.png'
};

// Product catalog IDs from Printful
const PRODUCTS = {
  tshirt: 71,      // Unisex Staple T-Shirt (Bella + Canvas 3001)
  hoodie: 146,     // Unisex Heavy Blend Hoodie (Gildan 18500)
  crewneck: 372,   // Unisex Crew Neck Sweatshirt
  cap: 534         // Snapback Hat
};

async function printfulRequest(endpoint, options = {}) {
  const response = await fetch(`${PRINTFUL_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response.json();
}

async function createProduct(name, productId, designUrl, colors, retailPrice) {
  console.log(`Creating: ${name}...`);

  // Get product variants
  const productInfo = await printfulRequest(`/products/${productId}`);
  if (productInfo.code !== 200) {
    console.error(`Failed to get product info for ${productId}`);
    return null;
  }

  // Filter variants by color and common sizes
  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  const variants = productInfo.result.variants.filter(v =>
    colors.some(c => v.color.toLowerCase().includes(c.toLowerCase())) &&
    sizes.includes(v.size)
  );

  if (variants.length === 0) {
    console.error(`No variants found for ${name}`);
    return null;
  }

  // Create sync product
  const syncProduct = {
    sync_product: {
      name: name,
      thumbnail: designUrl
    },
    sync_variants: variants.map(v => ({
      variant_id: v.id,
      retail_price: retailPrice,
      files: [
        {
          type: 'front',
          url: designUrl
        }
      ]
    }))
  };

  const result = await printfulRequest('/store/products', {
    method: 'POST',
    body: JSON.stringify(syncProduct)
  });

  if (result.code === 200) {
    console.log(`✓ Created: ${name} (ID: ${result.result.id})`);
    return result.result;
  } else {
    console.error(`✗ Failed: ${name} - ${result.error?.message || result.result}`);
    return null;
  }
}

async function main() {
  console.log('=== Setting up Printful Products for IDMG/MyStation ===\n');

  // Check store info first
  const storeInfo = await printfulRequest('/stores');
  if (storeInfo.code !== 200) {
    console.error('Failed to connect to Printful. Check your API key.');
    console.error(storeInfo);
    return;
  }
  console.log(`Connected to: ${storeInfo.result[0]?.name || 'Printful Store'}\n`);

  const products = [
    // IDMG Tees
    { name: 'IDMG Classic Tee - Black', productId: PRODUCTS.tshirt, design: DESIGNS.idmg, colors: ['black'], price: '29.99' },
    { name: 'IDMG Classic Tee - White', productId: PRODUCTS.tshirt, design: DESIGNS.idmg, colors: ['white'], price: '29.99' },

    // IDMG Hoodies
    { name: 'IDMG Hoodie - Black', productId: PRODUCTS.hoodie, design: DESIGNS.idmg, colors: ['black'], price: '54.99' },
    { name: 'IDMG Hoodie - White', productId: PRODUCTS.hoodie, design: DESIGNS.idmg, colors: ['white'], price: '54.99' },

    // LOTL Collection
    { name: 'Love on the Lawn 2026 Hoodie - Black', productId: PRODUCTS.hoodie, design: DESIGNS.lotl, colors: ['black'], price: '59.99' },
    { name: 'Love on the Lawn 2026 Tee - Black', productId: PRODUCTS.tshirt, design: DESIGNS.lotl, colors: ['black'], price: '34.99' },

    // Mike Page Foundation
    { name: 'Mike Page Foundation Tee', productId: PRODUCTS.tshirt, design: DESIGNS.mpf, colors: ['black', 'white'], price: '29.99' },
  ];

  let created = 0;
  for (const p of products) {
    const result = await createProduct(p.name, p.productId, p.design, p.colors, p.price);
    if (result) created++;
    // Rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n=== Done! Created ${created}/${products.length} products ===`);
  console.log('Check your Printful dashboard to review and publish.');
}

main().catch(console.error);
