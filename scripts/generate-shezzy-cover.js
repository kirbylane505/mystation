/**
 * Generate Shezzy Knew It Album Cover
 * Uses sharp to create a professional 3000x3000 cover
 */

const sharp = require('sharp');
const path = require('path');

const ALBUM_DIR = path.join(__dirname, '../public/images/albums');

async function createShezzyKnewItCover() {
  const size = 3000;

  // Create gradient background with overlay
  const gradientSvg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8B5CF6"/>
          <stop offset="50%" style="stop-color:#6D28D9"/>
          <stop offset="100%" style="stop-color:#1E1B4B"/>
        </linearGradient>
        <linearGradient id="glow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style="stop-color:#C084FC;stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:transparent"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <ellipse cx="1500" cy="800" rx="1200" ry="600" fill="url(#glow)"/>

      <!-- Decorative elements -->
      <circle cx="2600" cy="400" r="200" fill="#C084FC" opacity="0.15"/>
      <circle cx="400" cy="2600" r="300" fill="#8B5CF6" opacity="0.2"/>

      <!-- Text -->
      <text x="1500" y="2300" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="280" font-weight="900" fill="white" style="text-shadow: 0 20px 60px rgba(0,0,0,0.5)">SHEZZY</text>
      <text x="1500" y="2600" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="280" font-weight="900" fill="white" style="text-shadow: 0 20px 60px rgba(0,0,0,0.5)">KNEW IT</text>
      <text x="1500" y="2800" text-anchor="middle" font-family="Arial, sans-serif" font-size="100" font-weight="600" fill="#C084FC">MIKE PAGE</text>
    </svg>
  `;

  try {
    // Load and process headshot
    const headshot = await sharp(path.join(ALBUM_DIR, 'mike-page-headshot.jpg'))
      .resize(1800, 1800, { fit: 'cover', position: 'top' })
      .toBuffer();

    // Create base gradient
    const gradient = await sharp(Buffer.from(gradientSvg))
      .png()
      .toBuffer();

    // Composite headshot on gradient
    const cover = await sharp(gradient)
      .composite([
        {
          input: headshot,
          top: 200,
          left: 600,
          blend: 'over'
        },
        {
          // Dark overlay at bottom for text
          input: Buffer.from(`
            <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:transparent"/>
                  <stop offset="50%" style="stop-color:transparent"/>
                  <stop offset="100%" style="stop-color:#1E1B4B;stop-opacity:0.95"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#overlay)"/>

              <!-- Title -->
              <text x="1500" y="2350" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-size="320" font-weight="900" fill="white">SHEZZY</text>
              <text x="1500" y="2680" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-size="320" font-weight="900" fill="white">KNEW IT</text>
              <text x="1500" y="2880" text-anchor="middle" font-family="Arial, sans-serif" font-size="100" font-weight="600" fill="#C084FC">MIKE PAGE</text>

              <!-- Decorative line -->
              <rect x="1300" y="2750" width="400" height="6" fill="#8B5CF6" rx="3"/>
            </svg>
          `),
          blend: 'over'
        }
      ])
      .png({ quality: 100 })
      .toFile(path.join(ALBUM_DIR, 'shezzy-knew-it.jpg'));

    console.log('✅ Shezzy Knew It cover created: shezzy-knew-it.jpg');
  } catch (err) {
    console.error('Error creating cover:', err);

    // Fallback: create simple gradient cover without headshot
    const simpleCover = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6"/>
            <stop offset="50%" style="stop-color:#6D28D9"/>
            <stop offset="100%" style="stop-color:#1E1B4B"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        <text x="1500" y="1400" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="380" font-weight="900" fill="white">SHEZZY</text>
        <text x="1500" y="1800" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="380" font-weight="900" fill="white">KNEW IT</text>
        <text x="1500" y="2100" text-anchor="middle" font-family="Arial, sans-serif" font-size="140" font-weight="600" fill="#C084FC">MIKE PAGE</text>
      </svg>
    `;

    await sharp(Buffer.from(simpleCover))
      .png()
      .toFile(path.join(ALBUM_DIR, 'shezzy-knew-it.png'));

    console.log('✅ Simple Shezzy Knew It cover created');
  }
}

createShezzyKnewItCover();
