/**
 * Generate product mockup images using Pollinations AI
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '../public/images/merch');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const products = [
  {
    name: 'black-tshirt',
    prompt: 'professional product photo of a black t-shirt with small white "IDMG" text logo on center chest, plain black cotton tee, flat lay on white background, studio lighting, ecommerce product photography, clean minimal'
  },
  {
    name: 'white-tshirt',
    prompt: 'professional product photo of a white t-shirt with small black "IDMG" text logo on center chest, plain white cotton tee, flat lay on white background, studio lighting, ecommerce product photography, clean minimal'
  },
  {
    name: 'black-hoodie',
    prompt: 'professional product photo of a black hoodie sweatshirt with small white "IDMG" text logo on center chest, heavyweight fleece hoodie, flat lay on white background, studio lighting, ecommerce product photography'
  },
  {
    name: 'white-hoodie',
    prompt: 'professional product photo of a white hoodie sweatshirt with small black "IDMG" text logo on center chest, heavyweight fleece hoodie, flat lay on white background, studio lighting, ecommerce product photography'
  },
  {
    name: 'leggings',
    prompt: 'professional product photo of black athletic leggings with colorful pattern, womens fitness leggings, flat lay on white background, studio lighting, ecommerce product photography'
  }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function generateMockup(product) {
  const encodedPrompt = encodeURIComponent(product.prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true`;
  const outputPath = path.join(OUTPUT_DIR, `${product.name}.jpg`);

  console.log(`Generating ${product.name}...`);

  try {
    await downloadImage(imageUrl, outputPath);
    console.log(`✓ Created ${product.name}.jpg`);
    return true;
  } catch (err) {
    console.log(`✗ Failed ${product.name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Generating product mockups...\n');

  for (const product of products) {
    await generateMockup(product);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n✓ Done! Images saved to:', OUTPUT_DIR);
}

main();
