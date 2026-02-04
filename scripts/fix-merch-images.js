/**
 * Create proper merch mockups with logos
 */

const sharp = require('sharp');
const path = require('path');
const https = require('https');
const fs = require('fs');

const IDMG_LOGO = path.join(__dirname, '../public/images/idmg-logo.png');
const IDMG_LOGO_WHITE = path.join(__dirname, '../public/images/idmg-logo-white.png');
const LOTL_LOGO = path.join(__dirname, '../public/images/lotl-logo-2026.png');
const OUTPUT_DIR = path.join(__dirname, '../public/images/merch');

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => { file.close(); resolve(filepath); });
        });
      } else {
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(filepath); });
      }
    }).on('error', reject);
  });
}

async function createBlackTee() {
  console.log('Creating black tee with IDMG logo...');

  // Create black background with white logo
  const logo = await sharp(IDMG_LOGO_WHITE)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: 800, height: 800, channels: 4, background: '#1a1a1a' }
  })
  .composite([{ input: logo, left: 300, top: 250 }])
  .jpeg({ quality: 90 })
  .toFile(path.join(OUTPUT_DIR, 'idmg-black-tee-new.jpg'));

  console.log('✓ Created idmg-black-tee-new.jpg');
}

async function createLOTLCap() {
  console.log('Creating LOTL cap...');

  // Resize LOTL logo for cap
  const logo = await sharp(LOTL_LOGO)
    .resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create cap mockup (black background with logo)
  await sharp({
    create: { width: 800, height: 800, channels: 4, background: '#1a1a1a' }
  })
  .composite([{ input: logo, left: 250, top: 250 }])
  .png()
  .toFile(path.join(OUTPUT_DIR, 'lotl-cap-new.png'));

  console.log('✓ Created lotl-cap-new.png');
}

async function createLeggings() {
  console.log('Creating LOTL leggings mockup...');

  // Create leggings-style design with repeating LOTL pattern
  const logo = await sharp(LOTL_LOGO)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Create pattern with multiple logos
  const composites = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 4; col++) {
      composites.push({
        input: logo,
        left: col * 200 + (row % 2 === 0 ? 0 : 100),
        top: row * 160
      });
    }
  }

  await sharp({
    create: { width: 800, height: 800, channels: 4, background: '#1a1a1a' }
  })
  .composite(composites)
  .png()
  .toFile(path.join(OUTPUT_DIR, 'lotl-leggings-new.png'));

  console.log('✓ Created lotl-leggings-new.png');
}

async function main() {
  console.log('Fixing merch images...\n');

  await createBlackTee();
  await createLOTLCap();
  await createLeggings();

  console.log('\n✓ Done!');
}

main().catch(console.error);
