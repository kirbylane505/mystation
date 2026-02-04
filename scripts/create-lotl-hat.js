/**
 * Create LOTL hat mockup with logo
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO = path.join(__dirname, '../public/images/lotl-logo-2026.png');
const OUTPUT = path.join(__dirname, '../public/images/merch/lotl-hat.png');

async function createHatMockup() {
  console.log('Creating LOTL hat mockup...');

  // Create a hat-shaped design with LOTL logo
  // Simple approach: dark background with logo centered

  const logoBuffer = await sharp(LOGO)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 800,
      height: 800,
      channels: 4,
      background: '#1a1a1a'
    }
  })
  .composite([{
    input: logoBuffer,
    left: 200,
    top: 200
  }])
  .png()
  .toFile(OUTPUT);

  console.log('✓ Created lotl-hat.png');
}

createHatMockup().catch(console.error);
