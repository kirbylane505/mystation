/**
 * Upload remaining products to Printful
 */

const API_KEY = 'teu2OPdUuw133Ip5eYgtQ2GRC65CNXXU8ZwF8tNu';
const BASE_URL = 'https://api.printful.com';
const IMAGE_BASE = 'https://mystation.vercel.app/images/printful-mockups';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function uploadFile(fileName) {
  const imageUrl = `${IMAGE_BASE}/${fileName}`;
  console.log(`  Uploading ${fileName}...`);

  const response = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'default',
      url: imageUrl
    })
  });

  const data = await response.json();

  if (data.code === 200) {
    console.log(`  ✓ Uploaded (ID: ${data.result.id})`);
    return data.result;
  } else {
    console.log(`  ✗ Failed:`, data.error?.message || data.result);
    return null;
  }
}

async function createProduct(storeId, name, variants, fileId, retailPrice, fileType = 'front') {
  console.log(`Creating: ${name}...`);

  const syncVariants = variants.map(v => ({
    variant_id: v,
    retail_price: retailPrice,
    files: [{
      type: fileType,
      id: fileId
    }]
  }));

  const response = await fetch(`${BASE_URL}/store/products`, {
    method: 'POST',
    headers: {
      ...headers,
      'X-PF-Store-Id': storeId.toString()
    },
    body: JSON.stringify({
      sync_product: {
        name: name,
        thumbnail: null
      },
      sync_variants: syncVariants
    })
  });

  const data = await response.json();

  if (data.code === 200) {
    console.log(`✓ Created: ${name}`);
    return data.result;
  } else {
    console.log(`✗ Failed:`, data.error?.message || JSON.stringify(data).slice(0, 300));
    return null;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('UPLOADING REMAINING PRODUCTS TO PRINTFUL');
  console.log('='.repeat(50));

  const storeId = 15980634;
  console.log(`\nStore: Impossible's Dreamz Merch Shop (ID: ${storeId})\n`);

  // Correct White Hoodie variants: S=5522, M=5523, L=5524, XL=5525, 2XL=5526
  const hoodieWhiteVariants = [5522, 5523, 5524, 5525, 5526]; // S-2XL White

  // Correct Leggings variants: XS=7676, S=7677, M=7678, L=7679, XL=7680
  const leggingsVariants = [7676, 7677, 7678, 7679, 7680]; // XS-XL

  console.log('--- WHITE HOODIE ---');
  const hoodieWhiteFile = await uploadFile('hoodie-white-center.png');
  if (hoodieWhiteFile) {
    await createProduct(storeId, 'IDMG Hoodie - White', hoodieWhiteVariants, hoodieWhiteFile.id, '50.00', 'front');
  }

  console.log('\n--- LEGGINGS ---');
  const leggingsFile = await uploadFile('leggings-lotl-pattern.png');
  if (leggingsFile) {
    await createProduct(storeId, 'LOTL Leggings', leggingsVariants, leggingsFile.id, '45.00', 'default');
  }

  console.log('\n' + '='.repeat(50));
  console.log('✓ DONE! Check your Printful dashboard.');
  console.log('='.repeat(50));
}

main().catch(console.error);
