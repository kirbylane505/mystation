/**
 * Generate Legging designs for Printful
 * LOTL and IDMG versions
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../public/images/printful-mockups');
const LOGO_IDMG_WHITE = path.join(__dirname, '../public/images/idmg-logo-white.png');
const LOGO_LOTL = path.join(__dirname, '../public/images/lotl-logo-2026.png');

async function createLeggingDesign(name, logoPath, bgColor, logoSize, pattern = false) {
  // Printful legging dimensions (all-over print)
  const width = 5400;
  const height = 6300;

  try {
    // Resize logo
    const resizedLogo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    if (pattern) {
      // Create repeating pattern
      const tileSize = logoSize + 100;
      const cols = Math.ceil(width / tileSize) + 1;
      const rows = Math.ceil(height / tileSize) + 1;

      const composites = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Offset every other row for diamond pattern
          const offsetX = row % 2 === 0 ? 0 : tileSize / 2;
          composites.push({
            input: resizedLogo,
            left: Math.round(col * tileSize + offsetX - tileSize / 4),
            top: Math.round(row * tileSize - tileSize / 4)
          });
        }
      }

      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: bgColor
        }
      })
      .composite(composites)
      .png()
      .toFile(path.join(OUTPUT_DIR, `${name}.png`));

    } else {
      // Single large logo centered
      const left = Math.round((width - logoSize) / 2);
      const top = Math.round((height - logoSize) / 2.5);

      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: bgColor
        }
      })
      .composite([{
        input: resizedLogo,
        left,
        top
      }])
      .png()
      .toFile(path.join(OUTPUT_DIR, `${name}.png`));
    }

    console.log(`✓ Created ${name}.png`);
  } catch (err) {
    console.error(`✗ Failed ${name}:`, err.message);
  }
}

async function main() {
  console.log('Generating Legging designs...\n');

  // IDMG Leggings - Black with white logo pattern
  await createLeggingDesign('leggings-idmg-pattern', LOGO_IDMG_WHITE, '#1a1a1a', 400, true);

  // IDMG Leggings - Black with single large logo
  await createLeggingDesign('leggings-idmg-single', LOGO_IDMG_WHITE, '#1a1a1a', 1200, false);

  // LOTL Leggings - Black with LOTL logo
  await createLeggingDesign('leggings-lotl-single', LOGO_LOTL, '#1a1a1a', 1800, false);

  // LOTL Leggings - Pattern
  await createLeggingDesign('leggings-lotl-pattern', LOGO_LOTL, '#1a1a1a', 600, true);

  console.log('\n✓ Legging designs ready!');
  console.log('\nIn Printful:');
  console.log('1. Search "leggings" → Choose "All-Over Print Leggings"');
  console.log('2. Upload these designs');
  console.log('3. Use mockups with diverse/melanated models');
}

main();
