/**
 * Composite real LOTL logo onto product images
 */

const sharp = require('sharp');
const path = require('path');
const https = require('https');
const fs = require('fs');

const LOTL_LOGO = path.join(__dirname, '../public/images/lotl-logo-2026.png');
const OUTPUT_DIR = path.join(__dirname, '../public/images/merch');

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const request = (urlToFetch) => {
      https.get(urlToFetch, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          request(response.headers.location);
        } else {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(filepath); });
        }
      }).on('error', reject);
    };
    request(url);
  });
}

async function createLeggingsMockup() {
  console.log('Creating LOTL leggings with real logo...');

  // Download blank black leggings
  const blankPath = path.join(OUTPUT_DIR, 'blank-leggings-temp.jpg');
  const prompt = encodeURIComponent('plain solid black athletic leggings yoga pants flat lay on white background, no pattern no design no logo, simple blank black leggings, product photography');
  await downloadImage(`https://image.pollinations.ai/prompt/${prompt}?width=800&height=800&nologo=true&seed=12345`, blankPath);

  await new Promise(r => setTimeout(r, 2000));

  // Check if downloaded
  const stats = fs.statSync(blankPath);
  if (stats.size < 5000) {
    console.log('Blank leggings download failed, creating simple version...');
    // Create simple black background with logo pattern
    const logo = await sharp(LOTL_LOGO)
      .resize(120, 120, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const composites = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        composites.push({
          input: logo,
          left: col * 160 + (row % 2 === 0 ? 0 : 80),
          top: row * 160
        });
      }
    }

    await sharp({
      create: { width: 800, height: 800, channels: 4, background: '#1a1a1a' }
    })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(path.join(OUTPUT_DIR, 'lotl-leggings-final.jpg'));
  } else {
    // Composite logo onto leggings
    const logo = await sharp(LOTL_LOGO)
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(blankPath)
      .composite([
        { input: logo, left: 300, top: 200 },
        { input: logo, left: 300, top: 450 }
      ])
      .jpeg({ quality: 90 })
      .toFile(path.join(OUTPUT_DIR, 'lotl-leggings-final.jpg'));
  }

  console.log('✓ Created lotl-leggings-final.jpg');
}

async function createCapMockup() {
  console.log('Creating LOTL cap with real logo...');

  // Download blank black cap
  const blankPath = path.join(OUTPUT_DIR, 'blank-cap-temp.jpg');
  const prompt = encodeURIComponent('plain solid black baseball cap dad hat on white background, no logo no design no text, simple blank black cap, product photography studio lighting');
  await downloadImage(`https://image.pollinations.ai/prompt/${prompt}?width=800&height=800&nologo=true&seed=54321`, blankPath);

  await new Promise(r => setTimeout(r, 2000));

  const stats = fs.statSync(blankPath);
  if (stats.size < 5000) {
    console.log('Blank cap download failed, creating simple version...');
    // Create simple mockup
    const logo = await sharp(LOTL_LOGO)
      .resize(350, 350, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: 800, height: 800, channels: 4, background: '#2a2a2a' }
    })
    .composite([{ input: logo, left: 225, top: 225 }])
    .jpeg({ quality: 90 })
    .toFile(path.join(OUTPUT_DIR, 'lotl-cap-final.jpg'));
  } else {
    // Composite logo onto cap
    const logo = await sharp(LOTL_LOGO)
      .resize(250, 250, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp(blankPath)
      .composite([{ input: logo, left: 275, top: 200 }])
      .jpeg({ quality: 90 })
      .toFile(path.join(OUTPUT_DIR, 'lotl-cap-final.jpg'));
  }

  console.log('✓ Created lotl-cap-final.jpg');
}

async function main() {
  console.log('Compositing real LOTL logo onto products...\n');

  await createCapMockup();
  await createLeggingsMockup();

  // Cleanup temp files
  try {
    fs.unlinkSync(path.join(OUTPUT_DIR, 'blank-leggings-temp.jpg'));
    fs.unlinkSync(path.join(OUTPUT_DIR, 'blank-cap-temp.jpg'));
  } catch (e) {}

  console.log('\n✓ Done!');
}

main().catch(console.error);
