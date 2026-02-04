/**
 * Generate real product mockup photos using Pollinations AI
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

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
          file.on('finish', () => {
            file.close();
            resolve(filepath);
          });
        }
      }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    };

    request(url);
  });
}

async function generateProduct(name, prompt) {
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Date.now()}`;
  const outputPath = path.join(OUTPUT_DIR, `${name}.jpg`);

  console.log(`Generating ${name}...`);

  try {
    await downloadImage(url, outputPath);
    // Wait a bit for file to fully write
    await new Promise(r => setTimeout(r, 1000));
    const stats = fs.statSync(outputPath);
    if (stats.size > 1000) {
      console.log(`✓ ${name} (${Math.round(stats.size/1024)}KB)`);
      return true;
    } else {
      console.log(`✗ ${name} failed - file too small`);
      return false;
    }
  } catch (err) {
    console.log(`✗ ${name} error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Generating real product photos...\n');

  // Black cap with colorful festival logo
  await generateProduct('lotl-cap-real',
    'product photo black dad cap baseball hat with colorful embroidered festival logo on front, white background, ecommerce product photography, studio lighting, clean minimal'
  );

  await new Promise(r => setTimeout(r, 3000));

  // Black leggings with pattern
  await generateProduct('lotl-leggings-real',
    'product photo black athletic leggings yoga pants with colorful all over print pattern, laid flat on white background, womens fitness apparel, ecommerce product photography, studio lighting'
  );

  await new Promise(r => setTimeout(r, 3000));

  // Black t-shirt
  await generateProduct('idmg-black-tee-real',
    'product photo plain black t-shirt with small white circular logo on chest, cotton tee flat lay on white background, ecommerce product photography, studio lighting, clean minimal'
  );

  console.log('\n✓ Done!');
}

main().catch(console.error);
