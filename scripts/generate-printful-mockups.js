/**
 * Generate Printful-ready mockups with IDMG logo
 * Creates all 8 product variants
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../public/images/printful-mockups');
const LOGO_BLACK = path.join(__dirname, '../public/images/idmg-logo.png');
const LOGO_WHITE = path.join(__dirname, '../public/images/idmg-logo-white.png');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Product configurations
const products = [
  // T-Shirts
  { name: 'tshirt-black-center', bg: '#1a1a1a', logo: LOGO_WHITE, size: 300, position: 'center' },
  { name: 'tshirt-black-left', bg: '#1a1a1a', logo: LOGO_WHITE, size: 120, position: 'left' },
  { name: 'tshirt-white-center', bg: '#f5f5f5', logo: LOGO_BLACK, size: 300, position: 'center' },
  { name: 'tshirt-white-left', bg: '#f5f5f5', logo: LOGO_BLACK, size: 120, position: 'left' },
  // Hoodies
  { name: 'hoodie-black-center', bg: '#1a1a1a', logo: LOGO_WHITE, size: 280, position: 'center' },
  { name: 'hoodie-black-left', bg: '#1a1a1a', logo: LOGO_WHITE, size: 100, position: 'left' },
  { name: 'hoodie-white-center', bg: '#f5f5f5', logo: LOGO_BLACK, size: 280, position: 'center' },
  { name: 'hoodie-white-left', bg: '#f5f5f5', logo: LOGO_BLACK, size: 100, position: 'left' },
];

async function generateMockup(config) {
  const { name, bg, logo, size, position } = config;

  // Canvas size (Printful standard)
  const width = 4500;
  const height = 5400;

  // Calculate logo position
  let left, top;
  if (position === 'center') {
    // Center chest
    left = Math.round((width - size) / 2);
    top = Math.round(height * 0.25); // Upper third
  } else {
    // Left chest
    left = Math.round(width * 0.25);
    top = Math.round(height * 0.18);
  }

  try {
    // Resize logo
    const resizedLogo = await sharp(logo)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Create canvas with background color and composite logo
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: bg
      }
    })
    .composite([{
      input: resizedLogo,
      left,
      top
    }])
    .png()
    .toFile(path.join(OUTPUT_DIR, `${name}.png`));

    console.log(`✓ Created ${name}.png`);
  } catch (err) {
    console.error(`✗ Failed ${name}:`, err.message);
  }
}

async function main() {
  console.log('Generating Printful mockups...\n');

  for (const product of products) {
    await generateMockup(product);
  }

  console.log('\n✓ All mockups generated in:', OUTPUT_DIR);
  console.log('\nUpload these to Printful:');
  console.log('1. Go to Printful Dashboard → Add Product');
  console.log('2. Choose product (Bella+Canvas 3001 for tees, Gildan 18500 for hoodies)');
  console.log('3. Upload the matching design file');
  console.log('4. Set your price and publish!');
}

main();
