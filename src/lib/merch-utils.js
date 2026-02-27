/**
 * MYSTATION - Merch Utilities
 * Slug generation, color resolution, variant parsing for merch product pages
 */

// Generate URL-safe slug from product name
export function generateSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Find a product by slug in a product array
export function findProductBySlug(products, slug) {
  return products.find(p => generateSlug(p.name) === slug);
}

// Color swatch hex map — exact matches for common color names
export const COLOR_HEX = {
  'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#1B3A5C', 'Navy Blazer': '#1B3A5C',
  'Red': '#DC2626', 'Royal Blue': '#2563EB', 'Blue': '#3B82F6', 'Forest Green': '#166534',
  'Dark Green': '#166534', 'Green': '#22C55E', 'Heather Gray': '#9CA3AF', 'Sport Grey': '#9CA3AF',
  'Gray': '#6B7280', 'Grey': '#6B7280', 'Charcoal': '#374151', 'Dark Heather': '#4B5563',
  'Maroon': '#7F1D1D', 'Purple': '#7C3AED', 'Orange': '#F97316', 'Gold': '#EAB308',
  'Yellow': '#FACC15', 'Pink': '#EC4899', 'Light Pink': '#F9A8D4', 'Brown': '#92400E',
  'Sand': '#D2B48C', 'Tan': '#D2B48C', 'Olive': '#6B7B3A', 'Khaki': '#C3B091',
  'Light Blue': '#93C5FD', 'Heather Navy': '#2D4A6F', 'Heather Red': '#C05050',
  'Team Purple': '#6D28D9', 'Kelly Green': '#15803D', 'True Royal': '#1D4ED8',
  'Dark Chocolate': '#3E2723', 'Military Green': '#4B5320', 'Ash': '#B0B0B0',
  'Irish Green': '#009A44', 'Carolina Blue': '#56A0D3', 'Heliconia': '#E91E63',
  'Safety Pink': '#FF69B4', 'Safety Green': '#00FF00', 'Safety Orange': '#FF6600',
  'Sapphire': '#0F52BA', 'Indigo Blue': '#3F51B5', 'Antique Cherry Red': '#991B1B',
  'Turf Green': '#006400', 'Mint Green': '#98FB98', 'Coral Silk': '#F88379',
  'Orchid': '#DA70D6', 'Cardinal Red': '#C41E3A', 'Tropical Blue': '#00CED1',
  'Core Black': '#000000', 'Core White': '#FFFFFF', 'Core Red': '#DC2626',
  'Collegiate Navy': '#1B3A5C', 'Collegiate Royal': '#2563EB', 'Collegiate Green': '#166534',
  'Collegiate Burgundy': '#800020', 'Collegiate Purple': '#6D28D9', 'Collegiate Orange': '#F97316',
  'Grey Five': '#6B7280', 'Grey Three': '#9CA3AF', 'Grey Two': '#B0B0B0',
  'Power Red': '#DC2626', 'Team Power Red': '#DC2626', 'Bold Blue': '#2563EB',
  'Bliss Lilac': '#C8A2C8', 'Wonder White': '#FFFFFF', 'Semi Coral': '#F88379',
  'Pulse Lime': '#84CC16', 'Acid Yellow': '#FACC15', 'Crew Navy': '#1B3A5C',
  'Cloud White': '#F8F8FF', 'Almost Pink': '#FFD1DC', 'Preloved Ink': '#4B5563',
};

// Keyword fallback for fuzzy color matching
export const COLOR_KEYWORDS = {
  black: '#000000', white: '#FFFFFF', navy: '#1B3A5C', red: '#DC2626',
  royal: '#2563EB', blue: '#3B82F6', green: '#22C55E', forest: '#166534',
  gray: '#6B7280', grey: '#6B7280', charcoal: '#374151', heather: '#9CA3AF',
  maroon: '#7F1D1D', burgundy: '#800020', purple: '#7C3AED', orange: '#F97316',
  gold: '#EAB308', yellow: '#FACC15', pink: '#EC4899', brown: '#92400E',
  sand: '#D2B48C', tan: '#D2B48C', olive: '#6B7B3A', khaki: '#C3B091',
  coral: '#F88379', teal: '#14B8A6', indigo: '#3F51B5', violet: '#8B5CF6',
  cream: '#FFF8DC', ivory: '#FFFFF0', silver: '#C0C0C0', ash: '#B0B0B0',
  mint: '#98FB98', orchid: '#DA70D6', cardinal: '#C41E3A', crimson: '#DC143C',
  sapphire: '#0F52BA', cherry: '#991B1B', cobalt: '#0047AB', aqua: '#00FFFF',
  chocolate: '#3E2723', cocoa: '#D2691E', cinnamon: '#D2691E', caramel: '#FFD59A',
  mauve: '#E0B0FF', lavender: '#E6E6FA', rose: '#FF007F', blush: '#DE5D83',
  copper: '#B87333', bronze: '#CD7F32', rust: '#B7410E', wine: '#722F37',
  plum: '#8E4585', lilac: '#C8A2C8', sage: '#B2AC88', moss: '#8A9A5B',
  pewter: '#899499', steel: '#71797E', slate: '#708090', stone: '#938E86',
  midnight: '#191970', onyx: '#353839', jet: '#343434', ink: '#4B5563',
  lime: '#84CC16', lemon: '#FDE047', peach: '#FFDAB9', apricot: '#FBCEB1',
  scarlet: '#FF2400', magenta: '#FF00FF', fuchsia: '#FF00FF', cyan: '#00FFFF',
  turquoise: '#40E0D0', emerald: '#50C878', ruby: '#E0115F', amber: '#FFBF00',
  bone: '#E3DAC9', natural: '#FAF0E6', oatmeal: '#D3C6A6', latte: '#C8AD8B',
};

// Resolve color name to hex — exact match, title case, keyword extraction, substring
export function resolveColorHex(colorName) {
  if (!colorName) return null;
  if (COLOR_HEX[colorName]) return COLOR_HEX[colorName];
  const titleCased = colorName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  if (COLOR_HEX[titleCased]) return COLOR_HEX[titleCased];
  const words = colorName.toLowerCase().split(/[\s\-_/]+/);
  for (let i = words.length - 1; i >= 0; i--) {
    if (COLOR_KEYWORDS[words[i]]) return COLOR_KEYWORDS[words[i]];
  }
  const lower = colorName.toLowerCase();
  for (const [kw, hex] of Object.entries(COLOR_KEYWORDS)) {
    if (lower.includes(kw)) return hex;
  }
  return null;
}

// Known garment sizes and their display order
export const KNOWN_SIZES = new Set(['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'One size', 'OS']);
export const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// Parse variant title like "S / Black" or "Black / M" into { size, color }
export function parseVariantTitle(title) {
  const parts = (title || '').split(' / ').map(p => p.trim());
  let size = null;
  const colorParts = [];
  for (const part of parts) {
    if (KNOWN_SIZES.has(part) || /^\d+["″']\s*[×x]\s*\d+/.test(part)) {
      size = part;
    } else {
      colorParts.push(part);
    }
  }
  if (!size && parts.length === 1) size = parts[0];
  return { size: size || parts[0], color: colorParts.length > 0 ? colorParts.join(' / ') : null };
}

// Get all unique sizes and colors from variants
export function getVariantInfo(variants) {
  const sizes = new Set();
  const colors = new Set();
  for (const v of variants) {
    const { size, color } = parseVariantTitle(v.title || v.name);
    if (size) sizes.add(size);
    if (color) colors.add(color);
  }
  const orderedSizes = SIZE_ORDER.filter(s => sizes.has(s));
  const extraSizes = [...sizes].filter(s => !SIZE_ORDER.includes(s)).sort();
  return { sizes: [...orderedSizes, ...extraSizes], colors: [...colors].sort() };
}

// Parse variants into grouped size/color structure
export function parseVariantGroups(variants) {
  const sizes = [];
  const colorsBySize = {};
  const variantMap = {};
  (variants || []).forEach(v => {
    const { size, color } = parseVariantTitle(v.name || v.title || '');
    if (!sizes.includes(size)) sizes.push(size);
    if (color) {
      if (!colorsBySize[size]) colorsBySize[size] = [];
      if (!colorsBySize[size].includes(color)) colorsBySize[size].push(color);
    }
    variantMap[color ? `${size}::${color}` : size] = v;
  });
  const ordered = SIZE_ORDER.filter(s => sizes.includes(s));
  const extra = sizes.filter(s => !SIZE_ORDER.includes(s));
  return { sizes: [...ordered, ...extra], colorsBySize, variantMap, hasColors: Object.keys(colorsBySize).length > 0 };
}

// Product description generator
export function getProductDescription(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('bomber')) return 'Premium bomber jacket. Street-ready outerwear.';
  if (lower.includes('windbreaker')) return 'Lightweight windbreaker. All-weather ready.';
  if (lower.includes('track jacket')) return 'Classic track jacket. Athletic fit.';
  if (lower.includes('track pants')) return 'Tapered track pants. Athletic fit.';
  if (lower.includes('jogger')) return 'Premium joggers. Relaxed comfortable fit.';
  if (lower.includes('fleece short')) return 'Soft fleece shorts. Casual comfort.';
  if (lower.includes('mesh short')) return 'Breathable mesh shorts. Athletic ready.';
  if (lower.includes('athletic short')) return 'Performance athletic shorts.';
  if (lower.includes('zip hoodie')) return 'Full-zip hoodie. Premium heavyweight.';
  if (lower.includes('hoodie')) return 'Premium heavyweight hoodie. Street certified.';
  if (lower.includes('flip flop')) return 'Custom printed flip flops. Summer ready.';
  if (lower.includes('t-shirt') || lower.includes('tee')) return 'Classic premium cotton tee.';
  if (lower.includes('tote')) return 'Premium canvas tote bag.';
  if (lower.includes('snapback') || lower.includes('cap')) return 'Embroidered snapback trucker cap. Full logo front panel.';
  if (lower.includes('bucket') && lower.includes('hat')) return 'All-over print bucket hat. Festival ready.';
  if (lower.includes('sock')) return 'Premium custom socks. Comfort fit.';
  if (lower.includes('headband')) return 'Athletic headband. Moisture-wicking.';
  if (lower.includes('crop')) return 'Crop top. Festival ready.';
  if (lower.includes('tank')) return 'Premium tank top. Summer essential.';
  return 'Premium merchandise from IDMG.';
}

// Badge resolver
export function getBadge(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('lotl') || lower.includes('love on the lawn')) return 'LOTL';
  if (lower.includes('mpf') || lower.includes('mike page foundation')) return 'MPF';
  return null;
}

// Branded image resolver
export function getBrandedImage(name, printfulUrl, previewUrl) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('idmg') && lower.includes('hoodie') && !lower.includes('zip') && lower.includes('black')) return '/images/mockups/idmg-hoodie-black.jpg';
  if (lower.includes('idmg') && lower.includes('hoodie') && !lower.includes('zip') && lower.includes('white')) return '/images/mockups/idmg-hoodie-white.jpg';
  if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('hoodie')) return '/images/mockups/lotl-hoodie-black.jpg';
  if (lower.includes('idmg') && lower.includes('label') && (lower.includes('tee') || lower.includes('t-shirt'))) {
    return lower.includes('white') ? '/images/mockups/idmg-label-tee-white.jpg' : '/images/mockups/idmg-tee-black.jpg';
  }
  if (lower.includes('idmg') && lower.includes('label') && previewUrl) return previewUrl;
  if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('black')) return '/images/mockups/idmg-tee-black.jpg';
  if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('white')) return '/images/mockups/idmg-tee-white.jpg';
  if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('tee') || lower.includes('t-shirt'))) return '/images/mockups/lotl-tee-black.jpg';
  if ((lower.includes('mike page foundation') || lower.includes('mpf')) && !lower.includes('sweater')) return '/images/merch/catalog/mpf-collection-trio.png';
  if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('tote')) return '/images/mockups/lotl-tote.jpg';
  if (lower.includes('idmg') && (lower.includes('snapback') || lower.includes('cap'))) return '/images/mockups/idmg-snapback-black.jpg';
  if (lower.includes('idmg') && lower.includes('bucket')) return '/images/mockups/idmg-bucket-white.jpg';
  if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('snapback') || lower.includes('cap'))) return '/images/mockups/lotl-snapback-black.jpg';
  if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('bucket')) return '/images/mockups/lotl-bucket-white.jpg';
  if (lower.includes('cap') || lower.includes('hat')) return '/images/mockups/lotl-snapback-black.jpg';
  if (lower.includes('fleece short')) return 'https://images-api.printify.com/mockup/698acb1d3dc736df8a0c0d52/125496/112022/idmg-black-fleece-shorts.jpg?camera_label=front';
  if (lower.includes('hoodie')) return '/images/merch/idmg-black-hoodie.jpg';
  if (lower.includes('legging')) return '/images/merch/lotl-leggings-final.jpg';
  return previewUrl || printfulUrl || '/images/merch/idmg-black-tee-real.jpg';
}

// Color-aware modal image resolver
export function getModalImage(selectedVariant, item, productDetails) {
  const name = (item?.name || '').toLowerCase();
  const variantName = (selectedVariant?.name || selectedVariant?.title || '').toLowerCase();
  const isLight = variantName.includes('white') || variantName.includes('sand') || variantName.includes('light') || variantName.includes('ash') || variantName.includes('sport grey') || variantName.includes('natural');

  if (name.includes('idmg') && name.includes('hoodie') && !name.includes('zip')) {
    return isLight ? '/images/mockups/idmg-hoodie-white.jpg' : '/images/mockups/idmg-hoodie-black.jpg';
  }
  if (name.includes('idmg') && (name.includes('tee') || name.includes('t-shirt')) && !name.includes('label')) {
    return isLight ? '/images/mockups/idmg-tee-white.jpg' : '/images/mockups/idmg-tee-black.jpg';
  }
  if ((name.includes('lotl') || name.includes('love on the lawn')) && name.includes('hoodie')) {
    return '/images/mockups/lotl-hoodie-black.jpg';
  }

  // Try variant-specific image
  if (selectedVariant) {
    const previewFile = selectedVariant.files?.find(f => f.type === 'preview');
    if (previewFile?.preview_url) return previewFile.preview_url;
    if (selectedVariant.files?.[0]?.preview_url) return selectedVariant.files[0].preview_url;
    // Printify: match variant ID against images
    if (productDetails?.images?.length > 0) {
      const vid = selectedVariant.printifyVariantId || selectedVariant.id;
      if (vid) {
        const match = productDetails.images.find(img => (img.variant_ids || []).includes(vid));
        if (match?.src) return match.src;
      }
    }
  }

  return item?.image || item?.printfulImage || '/images/merch/idmg-black-tee-real.jpg';
}

// Printify name fix map
export const PRINTIFY_NAME_FIX = {
  'IDMG Festival Crop Top': 'IDMG Crop Top',
};
