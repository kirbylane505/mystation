/**
 * MYSTATION - Merch Page
 * Dual-provider: Printful + Printify products + Kids with Stripe links
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Truck, Shield, Package, X, Loader2, Check, Ticket, Sparkles, Search, ChevronDown, ExternalLink, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { usePlayerStore } from '@/store/playerStore';
import { generateSlug } from '@/lib/merch-utils';
import { getOfficialTracks } from '@/data/tracks';
import { motion, AnimatePresence } from 'framer-motion';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

// Color swatch hex map — exact matches for common color names
const COLOR_HEX = {
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
  // Printify-specific / brand color names
  'Core Black': '#000000', 'Core White': '#FFFFFF', 'Core Red': '#DC2626',
  'Collegiate Navy': '#1B3A5C', 'Collegiate Royal': '#2563EB', 'Collegiate Green': '#166534',
  'Collegiate Burgundy': '#800020', 'Collegiate Purple': '#6D28D9', 'Collegiate Orange': '#F97316',
  'Grey Five': '#6B7280', 'Grey Three': '#9CA3AF', 'Grey Two': '#B0B0B0',
  'Power Red': '#DC2626', 'Team Power Red': '#DC2626', 'Bold Blue': '#2563EB',
  'Bliss Lilac': '#C8A2C8', 'Wonder White': '#FFFFFF', 'Semi Coral': '#F88379',
  'Pulse Lime': '#84CC16', 'Acid Yellow': '#FACC15', 'Crew Navy': '#1B3A5C',
  'Cloud White': '#F8F8FF', 'Almost Pink': '#FFD1DC', 'Preloved Ink': '#4B5563',
};

// Smart color hex resolver — fuzzy matches Printify/Printful color names via keyword extraction
const COLOR_KEYWORDS = {
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

function resolveColorHex(colorName) {
  if (!colorName) return null;
  // 1. Exact match
  if (COLOR_HEX[colorName]) return COLOR_HEX[colorName];
  // 2. Title case
  const titleCased = colorName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  if (COLOR_HEX[titleCased]) return COLOR_HEX[titleCased];
  // 3. Keyword extraction — check each word (last word first, most specific)
  const words = colorName.toLowerCase().split(/[\s\-_/]+/);
  for (let i = words.length - 1; i >= 0; i--) {
    if (COLOR_KEYWORDS[words[i]]) return COLOR_KEYWORDS[words[i]];
  }
  // 4. Substring match — check if any keyword is contained in the full name
  const lower = colorName.toLowerCase();
  for (const [kw, hex] of Object.entries(COLOR_KEYWORDS)) {
    if (lower.includes(kw)) return hex;
  }
  return null;
}

// Scroll-triggered animation hook
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); }
    }, { threshold: 0.1, ...options });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, isVisible];
}

function ProductImage({ src, fallbackSrc, alt, className = '' }) {
  const [useFallback, setUseFallback] = useState(false);
  const [allFailed, setAllFailed] = useState(false);
  const currentSrc = useFallback ? fallbackSrc : src;

  if (allFailed || (!src && !fallbackSrc)) {
    return (
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-4">
          <ShoppingBag size={48} className="text-white/20 mx-auto mb-2" />
          <p className="text-white/30 text-sm">Image Coming Soon</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      onError={() => {
        if (!useFallback && fallbackSrc) setUseFallback(true);
        else setAllFailed(true);
      }}
    />
  );
}

// Parse Printify variant titles ("S / Black") into grouped size/color structure
function parseVariantGroups(variants) {
  const sizes = [];
  const colorsBySize = {};
  const variantMap = {};
  (variants || []).forEach(v => {
    const { size, color } = parseVariantTitle(v.name || '');
    if (!sizes.includes(size)) sizes.push(size);
    if (color) {
      if (!colorsBySize[size]) colorsBySize[size] = [];
      if (!colorsBySize[size].includes(color)) colorsBySize[size].push(color);
    }
    variantMap[color ? `${size}::${color}` : size] = v;
  });
  // Sort sizes in standard order
  const ordered = SIZE_ORDER.filter(s => sizes.includes(s));
  const extra = sizes.filter(s => !SIZE_ORDER.includes(s));
  return { sizes: [...ordered, ...extra], colorsBySize, variantMap, hasColors: Object.keys(colorsBySize).length > 0 };
}

function ProductSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-5">
        <div className="h-5 bg-white/10 rounded mb-2 w-3/4" />
        <div className="h-4 bg-white/5 rounded mb-3 w-full" />
        <div className="h-8 bg-white/10 rounded w-1/3" />
      </div>
    </div>
  );
}

// Kids items with direct Stripe checkout links
const KIDS_ITEMS = [
  {
    id: 'kids-lotl-tee',
    name: 'LOTL Kids Tee',
    description: 'Festival kids tee. Soft cotton.',
    image: '/images/merch/lotl-kids-tshirt.jpg',
    category: 'kids',
    price: '$15.99',
    link: 'https://buy.stripe.com/6oU9AU7Cy1tudTldke73G05',
    badge: 'KIDS',
  },
  {
    id: 'kids-lotl-sweater',
    name: 'LOTL Kids Sweater',
    description: 'Cozy festival sweater for kids.',
    image: '/images/merch/lotl-kids-sweater.jpg',
    category: 'kids',
    price: '$24.99',
    link: 'https://buy.stripe.com/cNieVe6yu3BC3eHbc673G06',
    badge: 'KIDS',
  },
  {
    id: 'kids-lotl-tee2',
    name: 'LOTL Kids Tee V2',
    description: 'Classic tee for little music lovers.',
    image: '/images/merch/lotl-kids-tshirt2.jpg',
    category: 'kids',
    price: '$15.99',
    link: 'https://buy.stripe.com/aFa8wQe0W1tucPh3JE73G07',
    badge: 'KIDS',
  },
  {
    id: 'kids-mpf-sweater',
    name: 'MPF Kids Sweater',
    description: 'Foundation sweater. Cozy & soft.',
    image: '/images/merch/mpf-kids-sweater.jpg',
    category: 'kids',
    price: '$19.99',
    link: 'https://buy.stripe.com/28E00kg94fkk2aDcga73G08',
    badge: 'KIDS',
  },
];

function ProductCard({ item, idx, onQuickView }) {
  return (
    <div
      className="group relative glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 cursor-pointer merch-card"
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      <Link href={`/merch/${generateSlug(item.name)}`} className="block">
        <div className="aspect-square relative overflow-hidden">
          <ProductImage src={item.image} fallbackSrc={item.printfulImage} alt={item.name} className="transition-transform duration-700 group-hover:scale-110" />
          {item.badge && (
            <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
              item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
              item.badge === 'MPF' ? 'bg-red-500 text-white' :
              item.badge === 'NEW' ? 'bg-green-500 text-white' :
              'bg-blue-500 text-white'
            }`}>{item.badge}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6">
            <span className="px-6 py-3 bg-white text-black font-bold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View Product</span>
          </div>
          <div className="merch-card-glow absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 0 30px rgba(59,130,246,0.15)' }} />
        </div>
        <div className="p-4">
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">{item.name}</h3>
          {/* Color swatches */}
          {item.colors && item.colors.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2">
              {item.colors.slice(0, 6).map((color, i) => {
                const hex = resolveColorHex(color);
                return hex ? (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: hex }} title={color} />
                ) : (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0 bg-gradient-to-br from-gray-400 to-gray-600" title={color} />
                );
              })}
              {item.colors.length > 6 && (
                <span className="text-white/40 text-[10px] font-medium ml-0.5">+{item.colors.length - 6}</span>
              )}
            </div>
          )}
          {/* Size range */}
          {item.sizes && item.sizes.length > 1 && (
            <p className="text-white/40 text-[11px] font-medium mb-2">
              Sizes: {item.sizes[0]} – {item.sizes[item.sizes.length - 1]}
            </p>
          )}
          {item.sizes && item.sizes.length === 1 && (
            <p className="text-white/40 text-[11px] font-medium mb-2">
              {item.sizes[0] === 'One size' || item.sizes[0] === 'OS' ? 'One Size' : `Size: ${item.sizes[0]}`}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-white">
              {item.startingPrice ? `$${item.startingPrice.toFixed(2)}` : '---'}
            </span>
            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full group-hover:bg-blue-400 transition-colors duration-300">
              {item.sizeCount > 1 && item.colorCount > 1
                ? `${item.sizeCount} sizes · ${item.colorCount} colors`
                : item.sizeCount > 1 ? `${item.sizeCount} sizes`
                : item.colorCount > 1 ? `${item.colorCount} colors`
                : item.synced > 1 ? `${item.synced} options`
                : 'Shop Now'}
            </span>
          </div>
        </div>
      </Link>
      {/* Quick View button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(item); }}
        className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white/60 hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
        title="Quick View"
      >
        <ExternalLink size={16} />
      </button>
    </div>
  );
}

function KidsCard({ item, idx }) {
  return (
    <div className="group glass rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-500 merch-card"
      style={{ animationDelay: `${idx * 0.08}s` }}>
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-square relative overflow-hidden bg-white">
          <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 bg-pink-500 text-white">{item.badge || 'KIDS'}</div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-pink-300 transition-colors duration-300">{item.name}</h3>
          <p className="text-white/40 text-xs mb-2">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-white">{item.price}</span>
            <span className="px-3 py-1 bg-pink-500 text-white text-xs font-bold rounded-full group-hover:bg-pink-400 transition-colors duration-300">Buy Now</span>
          </div>
        </div>
      </a>
    </div>
  );
}

// Parse Printify variant titles into size/color — handles "Size / Color" and "Color / Size" formats
const KNOWN_SIZES = new Set(['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'One size', 'OS']);
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

function parseVariantTitle(title) {
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

function getVariantInfo(variants) {
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

const PRINTIFY_NAME_FIX = {
  'IDMG Festival Crop Top': 'IDMG Crop Top',
};

export default function MerchPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [toast, setToast] = useState(null);
  const { addItem, openCart } = useCartStore();
  const { queue, setQueue } = usePlayerStore();

  // Queue "Never Let The Money" for merch page — ready to play on user tap
  // Does NOT auto-play — just loads the queue so player shows the track
  useEffect(() => {
    const state = usePlayerStore.getState();
    if (state.isPlaying || state.currentTrack) return; // Don't interrupt active or queued playback
    const lotlTrack = {
      id: 138,
      title: "Never Let The Money",
      artist: "Vincent Berry II",
      featured: "Mike Page",
      album: "Coming Soon",
      year: 2026,
      duration: "3:48",
      trackNumber: 8,
      albumId: 'singles-2026',
      audioFile: '/audio/grammy-nights/04-love-on-the-lawn.mp3',
      isNew: true,
    };
    const officialTracks = getOfficialTracks();
    const newReleaseTracks = officialTracks.filter(t => t.isNew && t.id !== 138);
    const fullQueue = [lotlTrack, ...newReleaseTracks];
    // Set queue + track without auto-playing
    usePlayerStore.setState({
      queue: fullQueue,
      queueIndex: 0,
      currentTrack: fullQueue[0],
      isPlaying: false,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        // Fetch from both Printful AND Printify in parallel
        const [printfulRes, printifyRes] = await Promise.all([
          fetch('/api/printful/products'),
          fetch('/api/printify/products'),
        ]);
        const [printfulData, printifyData] = await Promise.all([
          printfulRes.json(),
          printifyRes.json(),
        ]);

        let allProducts = [];

        // === PRINTFUL PRODUCTS ===
        if (printfulData.success) {
          // Hide mugs + 6 sportswear items replaced by Printify products
          const HIDDEN_PRINTFUL = ['bomber jacket', 'athletic short', 'windbreaker', 'track pants', 'track jacket', 'mesh short', 'wide-leg'];
          const filtered = printfulData.products.filter((p) => {
            const lower = p.name.toLowerCase();
            if (lower.includes('mug')) return false;
            if (HIDDEN_PRINTFUL.some(ex => lower.includes(ex))) return false;
            if (lower.includes('joggers') && !lower.includes('wide-leg') && !lower.includes('jogger short')) return false;
            return true;
          });

          const withPrices = await Promise.all(
            filtered.map(async (p) => {
              let startingPrice = null;
              let previewImage = null;
              let detailData = null;
              try {
                const detailRes = await fetch(`/api/printful/products/${p.id}`);
                detailData = await detailRes.json();
                if (detailData.success && detailData.product?.sync_variants) {
                  const variants = detailData.product.sync_variants;
                  const prices = variants
                    .map((v) => parseFloat(v.retail_price))
                    .filter((pr) => pr > 0);
                  if (prices.length > 0) startingPrice = Math.min(...prices);
                  const firstVariant = variants[0];
                  const previewFile = firstVariant?.files?.find(f => f.type === 'preview');
                  previewImage = previewFile?.preview_url || null;
                }
              } catch {}
              // Parse variants for size/color info
              let pfSizes = [], pfColors = [];
              if (detailData?.success && detailData?.product?.sync_variants) {
                const svs = detailData.product.sync_variants;
                const sizeSet = new Set(), colorSet = new Set();
                for (const v of svs) {
                  const { size, color } = parseVariantTitle(v.name || '');
                  if (size) sizeSet.add(size);
                  if (color) colorSet.add(color);
                }
                pfSizes = SIZE_ORDER.filter(s => sizeSet.has(s)).concat([...sizeSet].filter(s => !SIZE_ORDER.includes(s)));
                pfColors = [...colorSet].sort();
              }
              return {
                id: p.id,
                name: p.name,
                description: getProductDescription(p.name),
                category: getCategory(p.name),
                image: getBrandedImage(p.name, p.thumbnail_url, previewImage),
                printfulImage: previewImage || p.thumbnail_url,
                variants: p.variants,
                synced: p.synced,
                sizeCount: pfSizes.length,
                colorCount: pfColors.length,
                sizes: pfSizes,
                colors: pfColors,
                badge: getBadge(p.name),
                startingPrice,
                provider: 'printful',
                isPrintful: true,
              };
            })
          );

          // Deduplicate by name
          const seen = new Map();
          for (const p of withPrices) {
            const key = p.name.toLowerCase();
            if (!seen.has(key) || p.synced > seen.get(key).synced) {
              seen.set(key, p);
            }
          }
          allProducts = Array.from(seen.values());
        }

        // === PRINTIFY PRODUCTS ===
        if (printifyData.success && !printifyData.demo) {
          const HIDDEN_PRINTIFY = ['jogger', 'sweatpant', 'track pant', 'bike short', 'legging', 'copy of', 'custom hoodie', 'custom tee'];
          const printifyProducts = printifyData.products.filter((p) => {
            const lower = (p.title || '').toLowerCase();
            return !HIDDEN_PRINTIFY.some(ex => lower.includes(ex));
          }).map((p) => {
            const enabledVariants = (p.variants || []).filter(v => v.is_enabled !== false);
            const prices = enabledVariants.map(v => v.price / 100).filter(pr => pr > 0);
            const startingPrice = prices.length > 0 ? Math.min(...prices) : null;
            // ALWAYS use front-facing image (index 0) — logo must be visible on every product
            const defaultImg = (p.images || []).find(img => img.is_default);
            const firstImg = (p.images || [])[0];
            const image = defaultImg?.src || firstImg?.src || null;
            const rawName = p.title || 'Printify Product';
            const name = PRINTIFY_NAME_FIX[rawName] || rawName;

            // Strip HTML tags from Printify descriptions
            const rawDesc = (p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const cleanDesc = rawDesc.length > 120 ? rawDesc.slice(0, 120) + '...' : rawDesc;

            // Parse variants properly — handles both "Size / Color" and "Color / Size" formats
            const varInfo = getVariantInfo(enabledVariants);

            return {
              id: `printify_${p.id}`,
              printifyId: p.id,
              name,
              description: cleanDesc || getProductDescription(name),
              category: getPrintifyCategory(p.tags, name),
              image,
              printfulImage: null,
              variants: enabledVariants,
              synced: enabledVariants.length,
              sizeCount: varInfo.sizes.length,
              colorCount: varInfo.colors.length,
              sizes: varInfo.sizes,
              colors: varInfo.colors,
              badge: getBadge(name) || 'NEW',
              startingPrice,
              provider: 'printify',
              isPrintify: true,
            };
          });
          allProducts = [...allProducts, ...printifyProducts];
        }

        // Sort: hoodies first, then tees, then everything else
        const sorted = allProducts.sort((a, b) => {
          const getPriority = (name) => {
            const n = name.toLowerCase();
            if (n.includes('hoodie')) return 0;
            if (n.includes('tee') || n.includes('t-shirt')) return 1;
            if (n.includes('cap') || n.includes('hat')) return 2;
            if (n.includes('tote')) return 3;
            if (n.includes('sock')) return 4;
            if (n.includes('headband') || n.includes('band')) return 4;
            return 5;
          };
          return getPriority(a.name) - getPriority(b.name);
        });
        setProducts(sorted);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  function getBrandedImage(name, printfulUrl, previewUrl) {
    const lower = name.toLowerCase();

    // IDMG Hoodies (non-zip) — we have custom photos
    if (lower.includes('idmg') && lower.includes('hoodie') && !lower.includes('zip') && lower.includes('black')) return '/images/mockups/idmg-hoodie-black.jpg';
    if (lower.includes('idmg') && lower.includes('hoodie') && !lower.includes('zip') && lower.includes('white')) return '/images/mockups/idmg-hoodie-white.jpg';
    // LOTL Hoodie
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('hoodie')) return '/images/mockups/lotl-hoodie-black.jpg';

    // IDMG The Label TEES ONLY — custom branded mockups
    if (lower.includes('idmg') && lower.includes('label') && (lower.includes('tee') || lower.includes('t-shirt'))) {
      return lower.includes('white') ? '/images/mockups/idmg-label-tee-white.jpg' : '/images/mockups/idmg-tee-black.jpg';
    }

    // Fleece shorts — NEVER show model, use flat product image only
    if (lower.includes('fleece short')) return 'https://images-api.printify.com/mockup/698acb1d3dc736df8a0c0d52/125496/112022/idmg-black-fleece-shorts.jpg?camera_label=front';

    // IDMG The Label non-tee products (joggers, bomber, windbreaker, track, zip hoodie)
    // → Use Printful's actual product mockup preview
    if (lower.includes('idmg') && lower.includes('label') && previewUrl) return previewUrl;

    // IDMG Classic Tees
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('black')) return '/images/mockups/idmg-tee-black.jpg';
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('white')) return '/images/mockups/idmg-tee-white.jpg';
    // LOTL Tees
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('tee') || lower.includes('t-shirt'))) return '/images/mockups/lotl-tee-black.jpg';
    // MPF products
    if ((lower.includes('mike page foundation') || lower.includes('mpf')) && !lower.includes('sweater')) return '/images/merch/catalog/mpf-collection-trio.png';
    // LOTL Tote
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('tote')) return '/images/mockups/lotl-tote.jpg';
    // Caps/Hats — brand-specific mockups
    if (lower.includes('idmg') && (lower.includes('snapback') || lower.includes('cap'))) return '/images/mockups/idmg-snapback-black.jpg';
    if (lower.includes('idmg') && lower.includes('bucket')) return '/images/mockups/idmg-bucket-white.jpg';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('snapback') || lower.includes('cap'))) return '/images/mockups/lotl-snapback-black.jpg';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('bucket')) return '/images/mockups/lotl-bucket-white.jpg';
    if (lower.includes('cap') || lower.includes('hat')) return '/images/mockups/lotl-snapback-black.jpg';
    // Generic hoodie fallback
    if (lower.includes('hoodie')) return '/images/merch/idmg-black-hoodie.jpg';
    // Leggings
    if (lower.includes('legging')) return '/images/merch/lotl-leggings-final.jpg';

    // Fallback — prefer Printful preview, then thumbnail, then generic
    return previewUrl || printfulUrl || '/images/merch/idmg-black-tee-real.jpg';
  }

  function getProductDescription(name) {
    const lower = name.toLowerCase();
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
    if (lower.includes('t-shirt') || lower.includes('tee')) return 'Classic premium cotton tee.';
    if (lower.includes('tote')) return 'Premium canvas tote bag.';
    if (lower.includes('snapback') || lower.includes('cap')) return 'Embroidered snapback trucker cap. Full logo front panel.';
    if (lower.includes('bucket') && lower.includes('hat')) return 'All-over print bucket hat. Festival ready.';
    return 'Premium merchandise from IDMG.';
  }

  function getCategory(name) {
    const lower = name.toLowerCase();
    if (lower.includes('cap') || lower.includes('hat') || lower.includes('tote')) return 'accessories';
    return 'apparel';
  }

  function getBadge(name) {
    const lower = name.toLowerCase();
    if (lower.includes('lotl') || lower.includes('love on the lawn')) return 'LOTL';
    if (lower.includes('mpf') || lower.includes('mike page foundation')) return 'MPF';
    return null;
  }

  function getPrintifyCategory(tags, name) {
    const allTags = (tags || []).join(' ').toLowerCase();
    const lower = (name || '').toLowerCase();
    if (allTags.includes('accessories') || lower.includes('cap') || lower.includes('hat') || lower.includes('tote') || lower.includes('bag') || lower.includes('sock') || lower.includes('headband') || lower.includes('fan')) return 'accessories';
    if (lower.includes('kid') || allTags.includes('kid')) return 'kids';
    return 'apparel';
  }

  async function handleQuickView(item) {
    if (!item.isPrintful && !item.isPrintify) return;
    setSelectedItem(item);
    setLoadingDetails(true);
    setProductDetails(null);
    setSelectedVariant(null);
    setSelectedSize(null);
    setSelectedColor(null);
    try {
      if (item.isPrintify) {
        // Printify: fetch product details
        const res = await fetch(`/api/printify/products/${item.printifyId}`);
        const data = await res.json();
        if (data.success && data.product) {
          const enabledVariants = (data.product.variants || []).filter(v => v.is_enabled !== false);
          // Normalize to common shape
          setProductDetails({
            ...data.product,
            sync_variants: enabledVariants.map(v => ({
              id: v.id,
              name: v.title,
              retail_price: (v.price / 100).toFixed(2),
              printifyVariantId: v.id,
              printifyProductId: data.product.id,
            })),
            provider: 'printify',
          });
          // Only auto-select for single-option products; multi-color products use Color → Size flow
          const varInfo = getVariantInfo(enabledVariants);
          if (varInfo.colors.length <= 1 && enabledVariants.length > 0) {
            const first = enabledVariants[0];
            setSelectedVariant({
              id: first.id,
              name: first.title,
              retail_price: (first.price / 100).toFixed(2),
              printifyVariantId: first.id,
              printifyProductId: data.product.id,
            });
          }
        }
      } else {
        // Printful: existing logic
        const res = await fetch(`/api/printful/products/${item.id}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProductDetails({ ...data.product, provider: 'printful' });
          if (data.product.sync_variants?.length > 0) setSelectedVariant(data.product.sync_variants[0]);
        }
      }
    } catch (err) {
      // Product detail fetch failed — modal will show fallback UI
    } finally {
      setLoadingDetails(false);
    }
  }

  function getPrice(variant) {
    return variant ? parseFloat(variant.retail_price) || 0 : 0;
  }

  function getVariantImage(variant, fallback, printifyImages) {
    if (!variant) return fallback;
    // Printful: check files array
    const previewFile = variant.files?.find(f => f.type === 'preview');
    if (previewFile?.preview_url) return previewFile.preview_url;
    if (variant.files?.[0]?.preview_url) return variant.files[0].preview_url;
    if (variant.product?.image) return variant.product.image;
    // Printify: match variant ID against images[].variant_ids
    if (printifyImages && printifyImages.length > 0) {
      const vid = variant.printifyVariantId || variant.id;
      if (vid) {
        const match = printifyImages.find(img => (img.variant_ids || []).includes(vid));
        if (match?.src) return match.src;
      }
    }
    return fallback;
  }

  // Get color-aware branded mockup for the modal — our mockups with logos always win over Printful blanks
  function getModalImage(selectedVariant, item, productDetails) {
    const name = (item?.name || '').toLowerCase();
    const variantName = (selectedVariant?.name || '').toLowerCase();
    // Detect color from variant name
    const isLight = variantName.includes('white') || variantName.includes('sand') || variantName.includes('light') || variantName.includes('ash') || variantName.includes('sport grey') || variantName.includes('natural');
    const isDark = variantName.includes('black') || variantName.includes('navy') || variantName.includes('dark') || variantName.includes('charcoal') || variantName.includes('forest');

    // IDMG Hoodies (non-zip)
    if (name.includes('idmg') && name.includes('hoodie') && !name.includes('zip')) {
      if (isLight || name.includes('white')) return '/images/mockups/idmg-hoodie-white.jpg';
      return '/images/mockups/idmg-hoodie-black.jpg';
    }
    // IDMG Tees
    if (name.includes('idmg') && (name.includes('tee') || name.includes('t-shirt')) && !name.includes('label')) {
      if (isLight || name.includes('white')) return '/images/mockups/idmg-tee-white.jpg';
      return '/images/mockups/idmg-tee-black.jpg';
    }
    // LOTL Hoodie
    if ((name.includes('lotl') || name.includes('love on the lawn')) && name.includes('hoodie')) {
      return '/images/mockups/lotl-hoodie-black.jpg';
    }
    // For everything else, try variant-specific image from API, then item image
    return getVariantImage(selectedVariant, item?.image, productDetails?.images) || item?.printfulImage || '/images/merch/idmg-black-tee-real.jpg';
  }

  // Clean up variant name — strip product name prefix, show just the meaningful part
  function cleanVariantName(variantName, productName) {
    if (!variantName || !productName) return variantName || '';
    // Printful: "IDMG Hoodie - White / White / L" → strip "IDMG Hoodie - White" prefix
    const dash = productName.lastIndexOf(' - ');
    const baseName = dash > 0 ? productName.substring(0, dash) : productName;
    let clean = variantName;
    // Try stripping full product name first (exact), then base name
    if (clean.toLowerCase().startsWith(productName.toLowerCase())) {
      clean = clean.slice(productName.length);
    } else if (clean.toLowerCase().startsWith(baseName.toLowerCase())) {
      clean = clean.slice(baseName.length);
    }
    // Remove leading separators
    clean = clean.replace(/^\s*[-–—/]\s*/, '').trim();
    // If what's left repeats the color already in product name, strip it
    if (dash > 0) {
      const productColor = productName.substring(dash + 3).trim().toLowerCase();
      const parts = clean.split(' / ').map(p => p.trim());
      const filtered = parts.filter(p => p.toLowerCase() !== productColor);
      if (filtered.length > 0) clean = filtered.join(' / ');
    }
    return clean || variantName;
  }

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedItem) return;
    const provider = productDetails?.provider || selectedItem.provider || 'printful';
    addItem(
      { id: selectedItem.isPrintify ? selectedItem.printifyId : selectedItem.id, name: selectedItem.name, image: getModalImage(selectedVariant, selectedItem, productDetails) },
      selectedVariant,
      provider
    );
    setAddedToCart(true);
    // Show toast notification
    setToast({ name: selectedItem.name, image: getModalImage(selectedVariant, selectedItem, productDetails), price: getPrice(selectedVariant) });
    setTimeout(() => { setAddedToCart(false); setToast(null); }, 3000);
  };

  // Separate adult products from kids/youth/baby/toddler
  const kidsKeywords = ['kid', 'toddler', 'youth', 'baby', 'onesie', 'infant'];
  const isKidsProduct = (name) => kidsKeywords.some(k => (name || '').toLowerCase().includes(k));
  const adultProducts = products.filter(p => !isKidsProduct(p.name));
  const printifyKidsProducts = products.filter(p => isKidsProduct(p.name));
  const allAdultItems = adultProducts;

  // Organize into sections
  const getSection = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('hoodie') || n.includes('zip') || n.includes('jacket')) return 'hoodies';
    if (n.includes('tee') || n.includes('t-shirt')) return 'tees';
    if (n.includes('tank') || n.includes('crop')) return 'tops';
    if (n.includes('legging') || n.includes('jogger') || n.includes('short') || n.includes('bra') || n.includes('pant')) return 'activewear';
    if (n.includes('hat') || n.includes('bucket') || n.includes('cap') || n.includes('headband') || n.includes('beanie') || n.includes('skully')) return 'headwear';
    if (n.includes('bag') || n.includes('backpack') || n.includes('tote') || n.includes('fanny') || n.includes('drawstring')) return 'bags';
    if (n.includes('sock') || n.includes('bottle') || n.includes('towel') || n.includes('mat')) return 'essentials';
    return 'other';
  };

  const sectionOrder = [
    { id: 'hoodies', label: 'Hoodies & Outerwear', icon: '🧥' },
    { id: 'tees', label: 'T-Shirts', icon: '👕' },
    { id: 'tops', label: 'Tanks & Crop Tops', icon: '👚' },
    { id: 'activewear', label: 'Activewear', icon: '🏃' },
    { id: 'headwear', label: 'Hats & Headwear', icon: '🎩' },
    { id: 'bags', label: 'Bags & Accessories', icon: '🎒' },
    { id: 'essentials', label: 'Essentials', icon: '🧦' },
    { id: 'other', label: 'More', icon: '✨' },
  ];

  const sectionedProducts = {};
  allAdultItems.forEach(item => {
    const sec = getSection(item.name);
    if (!sectionedProducts[sec]) sectionedProducts[sec] = [];
    sectionedProducts[sec].push(item);
  });

  // Apply search filter
  const searchFiltered = searchQuery.trim()
    ? allAdultItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allAdultItems;

  // Apply sort
  const sortItems = (items) => {
    const sorted = [...items];
    switch (sortBy) {
      case 'price-asc': return sorted.sort((a, b) => (a.startingPrice || 999) - (b.startingPrice || 999));
      case 'price-desc': return sorted.sort((a, b) => (b.startingPrice || 0) - (a.startingPrice || 0));
      case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default: return sorted; // 'featured' — keep original order
    }
  };

  const filteredItems = activeCategory === 'all'
    ? sortItems(searchFiltered)
    : activeCategory === 'kids'
    ? [...KIDS_ITEMS, ...printifyKidsProducts]
    : sortItems(searchFiltered.filter(item => {
        if (activeCategory === 'apparel') return ['hoodies', 'tees', 'tops'].includes(getSection(item.name));
        if (activeCategory === 'activewear') return ['activewear'].includes(getSection(item.name));
        if (activeCategory === 'accessories') return ['headwear', 'bags', 'essentials', 'other'].includes(getSection(item.name));
        return true;
      }));

  // Also apply search to sectioned products
  const searchedSectionProducts = {};
  searchFiltered.forEach(item => {
    const sec = getSection(item.name);
    if (!searchedSectionProducts[sec]) searchedSectionProducts[sec] = [];
    searchedSectionProducts[sec].push(item);
  });

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'apparel', label: 'Apparel' },
    { id: 'activewear', label: 'Activewear' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'kids', label: 'Kids & Toddler' },
  ];

  const [heroRef, heroVisible] = useInView();
  const [shopRef, shopVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();
  const [promoRef, promoVisible] = useInView();

  return (
    <div className="min-h-screen">
      <style jsx global>{`
        @keyframes merch-float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(1deg); } }
        @keyframes merch-fade-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes merch-fade-scale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes merch-slide-left { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes merch-slide-right { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes merch-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes merch-glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.3); } 50% { box-shadow: 0 0 40px rgba(59,130,246,0.6); } }
        @keyframes merch-badge-pop { 0% { transform: scale(0); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes lotl-border-flow { 0% { background-position: 0% center; } 100% { background-position: 300% center; } }
        .merch-float { animation: merch-float 6s ease-in-out infinite; }
        .merch-card { opacity: 0; transform: translateY(20px); animation: merch-fade-up 0.6s ease-out forwards; }
        .merch-card:hover { transform: translateY(-8px) scale(1.02) !important; }
        .merch-card:hover .merch-card-glow { opacity: 1; }
        .merch-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent); background-size: 200% 100%; animation: merch-shimmer 3s ease-in-out infinite; }
        select option { background: #1a1a2e; color: #fff; }
        [data-rmiz-modal-overlay] { background: rgba(0,0,0,0.85) !important; }
      `}</style>

      {/* ============ BACK BUTTON ============ */}
      <div className="max-w-screen-xl mx-auto px-6 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft size={16} />
          Back to MyStation
        </Link>
      </div>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/60 to-pink-900/50" />
        <div className="bg-orb w-[600px] h-[600px] bg-fuchsia-500 top-[-200px] left-[-200px]" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-500 top-[100px] right-[-150px]" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className={`relative w-full max-w-lg transition-all duration-1000 ${heroVisible ? 'opacity-100' : 'opacity-0 -translate-x-16'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl merch-float" style={{ animationDuration: '6s' }}>
                <Image src="/images/merch/idmg-black-hoodie.jpg" alt="IDMG The Label" width={800} height={800} className="w-full h-auto transition-transform duration-700 hover:scale-110" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Official Collection</p>
                  <p className="text-white font-black text-2xl">IDMG The Label</p>
                </div>
              </div>
            </div>

            <div className={`text-center lg:text-left flex-1 transition-all duration-1000 delay-300 ${heroVisible ? 'opacity-100' : 'opacity-0 translate-x-16'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6 merch-shimmer">
                <ShoppingBag size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Official Merchandise</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                Mike Page<br /><span className="gradient-text">Merch</span>
              </h1>
              <p className="text-lg text-white/50 mb-6 max-w-lg">
                Every item printed and shipped by Printful. Proceeds help build youth and community programs worldwide.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link href="#shop" className="btn-primary flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">
                  <ShoppingBag size={18} /> Shop Now
                </Link>
                <a href="https://cash.app/$RIDE4PAGEMUSIC847" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 hover:scale-105 transition-all duration-300">
                  <Heart size={18} /> Donate Direct
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BADGES ============ */}
      <section className="py-6 border-y border-white/5">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: Truck, label: 'Free Shipping $50+' },
              { icon: Shield, label: '100% Authentic' },
              { icon: Heart, label: 'Supports Youth Programs' },
              { icon: Package, label: 'Print on Demand' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/50 hover:text-white transition-all duration-300 hover:scale-110 cursor-default" style={{ animation: `merch-fade-up 0.5s ease-out ${0.6 + i * 0.1}s forwards`, opacity: 0 }}>
                <item.icon size={20} className="text-blue-400" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LOTL 2026 PROMO BANNER ============ */}
      <section ref={promoRef} className="py-6">
        <div className={`max-w-screen-xl mx-auto px-6 transition-all duration-700 ${promoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="relative overflow-hidden rounded-2xl p-[2px]" style={{ background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #f97316)', backgroundSize: '300% 100%', animation: promoVisible ? 'lotl-border-flow 6s linear infinite' : 'none' }}>
            <div className="relative rounded-2xl px-6 py-6 md:px-10 md:py-8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #1a0a2e 100%)' }}>

              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center border border-orange-400/40" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.2))' }}>
                    <Ticket size={30} className="text-orange-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-yellow-400" />
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Love on the Lawn 2026 Promo</span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg md:text-xl font-black text-white">
                        Spend $50+ &rarr; Get <span className="text-orange-300">25% OFF</span> LOTL tickets
                      </h3>
                      <h3 className="text-lg md:text-xl font-black text-white">
                        Spend $100+ &rarr; Get <span className="text-pink-300">1 FREE TICKET</span>
                      </h3>
                    </div>
                    <p className="text-white/50 text-sm mt-2">Discount code comes on your receipt after checkout.</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href="#shop" className="inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-full transition-all hover:scale-105 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316, #ec4899)', boxShadow: '0 4px 20px rgba(249,115,22,0.4)' }}>
                    <ShoppingBag size={18} /> Shop & Save
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BUNDLE DEALS ============ */}
      <section className="py-12 relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-bold mb-3">BUNDLE & SAVE</span>
            <h2 className="text-3xl font-black text-white mb-2">Deal Packs</h2>
            <p className="text-white/50">Buy more, save more. Auto-discount at checkout.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
            {/* Deal 1: 2 Tanks */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👕</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $5</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">2 Tanks</h3>
              <p className="text-white/40 text-sm mb-3">Any 2 tank tops — mix IDMG, LOTL, or MPF</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$44.98</span>
                <span className="text-white/30 line-through text-sm">$49.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$24.99 each × 2 with 10% off</p>
            </div>

            {/* Deal 2: 2 Crop Tops */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👚</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $5</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">2 Crop Tops</h3>
              <p className="text-white/40 text-sm mb-3">Any 2 crop tops — IDMG or LOTL Festival</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$44.98</span>
                <span className="text-white/30 line-through text-sm">$49.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$24.99 each × 2 with 10% off</p>
            </div>

            {/* Deal 3: Sock + Tote Duo */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🧦</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $5</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Socks + Tote</h3>
              <p className="text-white/40 text-sm mb-3">Crew socks + tote bag combo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$44.98</span>
                <span className="text-white/30 line-through text-sm">$49.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$24.99 each × 2 with 10% off</p>
            </div>

            {/* Deal 4: Festival Pack */}
            <div className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎪</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">FESTIVAL PACK</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Festival Essentials</h3>
              <p className="text-white/40 text-sm mb-3">Bucket hat + fanny pack + socks + tote + water bottle</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-400">$106.21</span>
                <span className="text-white/30 line-through text-sm">$124.95</span>
              </div>
              <p className="text-white/30 text-xs mt-1">5 items = 15% off everything</p>
            </div>

            {/* Deal 5: Full Fit */}
            <div className="glass rounded-2xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🔥</span>
                <span className="px-2 py-0.5 bg-pink-500/20 text-pink-400 text-xs font-bold rounded-full">FULL FIT</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Full Fit Pack</h3>
              <p className="text-white/40 text-sm mb-3">Tank + shorts + sports bra + socks + hat</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-pink-400">$106.21</span>
                <span className="text-white/30 line-through text-sm">$124.95</span>
              </div>
              <p className="text-white/30 text-xs mt-1">5 items = 15% off everything</p>
            </div>

            {/* Deal 6: Mix & Match */}
            <div className="glass rounded-2xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💎</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">MIX & MATCH</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Any 5+ Items</h3>
              <p className="text-white/40 text-sm mb-3">Pick any 5 or more items from the whole store</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-400">15% OFF</span>
              </div>
              <p className="text-white/30 text-xs mt-1">Auto-applied at checkout — no code needed</p>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-6 px-6 py-3 bg-white/5 rounded-full">
              <span className="text-white/40 text-sm">2+ items = <span className="text-green-400 font-bold">10% OFF</span></span>
              <span className="text-white/20">|</span>
              <span className="text-white/40 text-sm">5+ items = <span className="text-green-400 font-bold">15% OFF</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SHOP ============ */}
      <section ref={shopRef} id="shop" className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-blue-900/20 to-mystation-black" />
        <div className="bg-orb w-[400px] h-[400px] bg-pink-500 top-[20%] left-[-100px] opacity-50" />
        <div className="bg-orb w-[300px] h-[300px] bg-blue-400 bottom-[10%] right-[-50px] opacity-40" style={{ animationDelay: '-4s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className={`text-center mb-12 transition-all duration-700 ${shopVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl font-black text-white mb-4">Shop the Collection</h2>
            <p className="text-white/50">
              {loading ? 'Loading store...' : `${adultProducts.length + KIDS_ITEMS.length + printifyKidsProducts.length} items — Printed & shipped by Printful + Printify`}
            </p>
          </div>

          {/* Search + Sort + Category Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer hover:bg-white/10 transition-all"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            </div>
          </div>

          {/* Result count when searching */}
          {searchQuery && (
            <div className="text-center mb-4">
              <span className="text-white/40 text-sm">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found for &ldquo;{searchQuery}&rdquo;</span>
            </div>
          )}

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-secondary">Try Again</button>
            </div>
          )}

          {/* Products Grid — Organized by Section */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <ProductSkeleton key={`skel-${i}`} />)}
            </div>
          ) : activeCategory === 'kids' ? (
            /* Kids-only view — original + Printify kids */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {KIDS_ITEMS.map((item, idx) => (
                <KidsCard key={item.id} item={item} idx={idx} />
              ))}
              {printifyKidsProducts.map((item, idx) => (
                <ProductCard key={item.id} item={item} idx={idx + KIDS_ITEMS.length} onQuickView={handleQuickView} />
              ))}
            </div>
          ) : activeCategory === 'all' && !searchQuery && sortBy === 'featured' ? (
            /* All Items — organized sections + kids at bottom (only when not searching/sorting) */
            <>
              {sectionOrder.map(sec => {
                const items = searchedSectionProducts[sec.id];
                if (!items || items.length === 0) return null;
                return (
                  <div key={sec.id} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-2xl">{sec.icon}</span>
                      <h3 className="text-xl font-black text-white">{sec.label}</h3>
                      <span className="text-white/30 text-sm">({items.length})</span>
                      <div className="flex-1 h-px bg-white/10 ml-4" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map((item, idx) => (
                        <ProductCard key={item.id} item={item} idx={idx} onQuickView={handleQuickView} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* ===== KIDS & TODDLER SECTION ===== */}
              <div className="mb-12 mt-16">
                <div className="text-center mb-8">
                  <span className="inline-block px-4 py-1.5 bg-pink-500/10 border border-pink-500/30 rounded-full text-pink-400 text-sm font-bold mb-3">FOR THE LITTLE ONES</span>
                  <h3 className="text-3xl font-black text-white mb-2">Kids & Toddler</h3>
                  <p className="text-white/50 text-sm">Festival-ready gear for the youngest fans</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {KIDS_ITEMS.map((item, idx) => (
                    <KidsCard key={item.id} item={item} idx={idx} />
                  ))}
                  {printifyKidsProducts.map((item, idx) => (
                    <ProductCard key={item.id} item={item} idx={idx + KIDS_ITEMS.length} onQuickView={handleQuickView} />
                  ))}
                </div>
              </div>
            </>
          ) : activeCategory === 'kids' ? null : (
            /* Filtered/searched/sorted view — flat grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                <ProductCard key={item.id} item={item} idx={idx} onQuickView={handleQuickView} />
              )) : (
                <div className="col-span-full text-center py-16">
                  <ShoppingBag size={48} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 text-lg">No products found</p>
                  <button onClick={() => { setSearchQuery(''); setSortBy('featured'); }} className="mt-4 text-blue-400 hover:text-blue-300 text-sm">Clear filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section ref={ctaRef} className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className={`glass rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden transition-all duration-1000 ${ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative">
              <Image src="/images/mpf-logo.png" alt="Mike Page Foundation" width={80} height={80} className={`mx-auto mb-6 transition-all duration-700 delay-300 ${ctaVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
              <h2 className={`text-3xl lg:text-4xl font-black text-white mb-4 transition-all duration-700 delay-500 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>Every Purchase Supports the Mission</h2>
              <p className={`text-white/50 text-lg mb-8 max-w-2xl mx-auto transition-all duration-700 delay-700 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                The Mike Page Foundation is a 501(c)(3) nonprofit dedicated to youth music education,
                scholarships, and community programs like Love on the Lawn.
              </p>
              <div className={`flex flex-wrap gap-4 justify-center transition-all duration-700 delay-900 ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <Link href="/about" className="btn-primary hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300">Learn About the Foundation</Link>
                <a href="https://cash.app/$RIDE4PAGEMUSIC847" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 hover:scale-105 transition-all duration-300">
                  <Heart size={18} /> Donate Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUICK VIEW MODAL ============ */}
      <AnimatePresence>
      {selectedItem && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => { setSelectedItem(null); setProductDetails(null); setSelectedVariant(null); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="glass rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-square relative bg-white overflow-hidden">
                <Zoom zoomMargin={40}>
                  <img
                    src={getModalImage(selectedVariant, selectedItem, productDetails)}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </Zoom>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 rounded-md text-white/60 text-xs pointer-events-none">Click to zoom</div>
              </div>
              <div className="p-6 lg:p-8 relative">
                <button onClick={() => { setSelectedItem(null); setProductDetails(null); setSelectedVariant(null); }} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition">
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black text-white mb-2 pr-12">{selectedItem.name}</h2>
                <p className="text-white/50 mb-4">{selectedItem.description}</p>

                {loadingDetails ? (
                  <div className="flex items-center gap-3 py-8">
                    <Loader2 size={24} className="animate-spin text-blue-400" />
                    <span className="text-white/60">Loading sizes...</span>
                  </div>
                ) : productDetails ? (
                  <>
                    <p className="text-3xl font-black text-white mb-6">${selectedVariant ? getPrice(selectedVariant).toFixed(2) : '---'}</p>
                    <div className="mb-6">
                      {(() => {
                        const variants = productDetails.sync_variants || [];
                        const { sizes, colorsBySize, variantMap, hasColors } = parseVariantGroups(variants);

                        // Simple flat list for products with few variants or no color dimension
                        if (variants.length <= 12 || !hasColors) {
                          return (
                            <>
                              <label className="text-white/60 text-sm mb-3 block">Select Option ({variants.length} available)</label>
                              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {variants.map((variant) => (
                                  <button key={variant.id} onClick={() => setSelectedVariant(variant)}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${selectedVariant?.id === variant.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}>
                                    <div className="flex justify-between items-center">
                                      <span>{cleanVariantName(variant.name, selectedItem?.name)}</span>
                                      <span className="font-bold">${getPrice(variant).toFixed(2)}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </>
                          );
                        }

                        // Grouped size + color selector with visual swatches
                        // Get all unique colors across all sizes
                        const allColors = [...new Set(Object.values(colorsBySize).flat())];
                        const currentColors = selectedSize ? (colorsBySize[selectedSize] || []) : allColors;

                        return (
                          <>
                            {/* Color Swatches — show first so user picks color, then size */}
                            {allColors.length > 0 && (
                              <>
                                <label className="text-white/60 text-sm mb-3 block">
                                  Color{selectedColor ? `: ${selectedColor}` : ''} ({allColors.length} available)
                                </label>
                                <div className="flex flex-wrap gap-2.5 mb-5">
                                  {allColors.map(color => {
                                    const hex = resolveColorHex(color);
                                    const isAvailable = !selectedSize || (colorsBySize[selectedSize] || []).includes(color);
                                    const isSelected = selectedColor === color;
                                    return (
                                      <button key={color} onClick={() => {
                                        setSelectedColor(color);
                                        if (selectedSize && variantMap[`${selectedSize}::${color}`]) {
                                          setSelectedVariant(variantMap[`${selectedSize}::${color}`]);
                                        } else if (!selectedSize) {
                                          // Find first size with this color and auto-select
                                          const firstSize = sizes.find(s => (colorsBySize[s] || []).includes(color));
                                          if (firstSize) {
                                            setSelectedSize(firstSize);
                                            setSelectedVariant(variantMap[`${firstSize}::${color}`]);
                                          }
                                        }
                                      }}
                                      disabled={!isAvailable}
                                      title={color}
                                      className={`relative w-9 h-9 rounded-full transition-all ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'} ${!isAvailable ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                                        {hex ? (
                                          <span className="block w-full h-full rounded-full border-2 border-white/20" style={{ backgroundColor: hex }} />
                                        ) : (
                                          <span className="block w-full h-full rounded-full border-2 border-white/30 bg-white/10 text-[8px] text-white/70 flex items-center justify-center font-bold">
                                            {color.slice(0, 2)}
                                          </span>
                                        )}
                                        {isSelected && <span className="absolute inset-0 flex items-center justify-center"><Check size={14} className={`${hex === '#FFFFFF' || hex === '#FACC15' || hex === '#EAB308' || hex === '#FFF8DC' || hex === '#FFFFF0' ? 'text-black' : 'text-white'} drop-shadow-md`} /></span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}

                            {/* Size Grid */}
                            <label className="text-white/60 text-sm mb-3 block">Size ({sizes.length} available)</label>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {sizes.map(size => {
                                const isAvailable = !selectedColor || (colorsBySize[size] || []).includes(selectedColor);
                                return (
                                  <button key={size} onClick={() => {
                                    setSelectedSize(size);
                                    if (selectedColor && variantMap[`${size}::${selectedColor}`]) {
                                      setSelectedVariant(variantMap[`${size}::${selectedColor}`]);
                                    } else {
                                      const colors = colorsBySize[size] || [];
                                      if (colors.length === 1) {
                                        setSelectedColor(colors[0]);
                                        setSelectedVariant(variantMap[`${size}::${colors[0]}`]);
                                      }
                                    }
                                  }}
                                  disabled={!isAvailable}
                                  className={`px-4 py-2.5 rounded-lg text-sm font-bold transition ${
                                    selectedSize === size ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
                                    !isAvailable ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                                    'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                                  }`}>
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={handleAddToCart} disabled={!selectedVariant || addedToCart}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition ${addedToCart ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'}`}>
                      {addedToCart ? (<><Check size={18} /> Added to Cart!</>) : (<><ShoppingBag size={18} /> Add to Cart - ${selectedVariant ? getPrice(selectedVariant).toFixed(2) : '---'}</>)}
                    </button>
                    <p className="text-center text-white/40 text-xs mt-2">Printed & shipped by {productDetails?.provider === 'printify' ? 'Printify' : 'Printful'}</p>
                  </>
                ) : (
                  <p className="text-white/40 py-8">Unable to load product details</p>
                )}

                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-6 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><Shield size={14} /> Authentic</span>
                  <span className="flex items-center gap-1"><Truck size={14} /> Fast Shipping</span>
                  <span className="flex items-center gap-1"><Heart size={14} /> Supports Youth</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ============ TOAST NOTIFICATION ============ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-28 right-6 z-[700] flex items-center gap-3 px-5 py-4 bg-gray-900 border border-green-500/30 rounded-2xl shadow-2xl shadow-green-500/10 max-w-sm"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
              {toast.image && <img src={toast.image} alt="" className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-green-400 text-sm font-bold flex items-center gap-1"><Check size={14} /> Added to Cart</p>
              <p className="text-white text-xs truncate">{toast.name}</p>
            </div>
            <button onClick={() => { setToast(null); openCart(); }} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full hover:bg-blue-400 transition flex-shrink-0">
              View Cart
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
