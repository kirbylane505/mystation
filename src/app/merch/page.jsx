/**
 * MYSTATION - Merch Page
 * Dual-provider: Printful + Printify products + Kids with Stripe links
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Truck, Shield, Package, X, Loader2, Check, Ticket, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

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
      className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 cursor-pointer merch-card"
      style={{ animationDelay: `${idx * 0.06}s` }}
      onClick={() => onQuickView(item)}
    >
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
          <span className="px-6 py-3 bg-white text-black font-bold rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Select Size & Buy</span>
        </div>
        <div className="merch-card-glow absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none rounded-2xl" style={{ boxShadow: 'inset 0 0 30px rgba(59,130,246,0.15)' }} />
      </div>
      <div className="p-4">
        <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">{item.name}</h3>
        <p className="text-white/40 text-xs mb-2">{item.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-black text-white">
            {item.startingPrice ? `$${item.startingPrice.toFixed(2)}` : '---'}
          </span>
          <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full group-hover:bg-blue-400 transition-colors duration-300">
            {item.synced > 1 ? `${item.synced} sizes` : 'Buy Now'}
          </span>
        </div>
      </div>
    </div>
  );
}

function KidsCard({ item, idx }) {
  return (
    <div className="group glass rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all duration-500 merch-card"
      style={{ animationDelay: `${idx * 0.08}s` }}>
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-square relative overflow-hidden bg-white">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
  const { addItem } = useCartStore();

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
              try {
                const detailRes = await fetch(`/api/printful/products/${p.id}`);
                const detailData = await detailRes.json();
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
              return {
                id: p.id,
                name: p.name,
                description: getProductDescription(p.name),
                category: getCategory(p.name),
                image: getBrandedImage(p.name, p.thumbnail_url, previewImage),
                printfulImage: previewImage || p.thumbnail_url,
                variants: p.variants,
                synced: p.synced,
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
          const HIDDEN_PRINTIFY = ['jogger', 'sweatpant', 'track pant', 'bike short', 'legging'];
          const printifyProducts = printifyData.products.filter((p) => {
            const lower = (p.title || '').toLowerCase();
            return !HIDDEN_PRINTIFY.some(ex => lower.includes(ex));
          }).map((p) => {
            const enabledVariants = (p.variants || []).filter(v => v.is_enabled !== false);
            const prices = enabledVariants.map(v => v.price / 100).filter(pr => pr > 0);
            const startingPrice = prices.length > 0 ? Math.min(...prices) : null;
            const defaultImg = (p.images || []).find(img => img.is_default);
            const firstImg = (p.images || [])[0];
            const image = defaultImg?.src || firstImg?.src || null;
            const name = p.title || 'Printify Product';

            // Strip HTML tags from Printify descriptions
            const rawDesc = (p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const cleanDesc = rawDesc.length > 120 ? rawDesc.slice(0, 120) + '...' : rawDesc;

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

    // IDMG The Label non-tee products (shorts, joggers, bomber, windbreaker, track, zip hoodie)
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
          if (enabledVariants.length > 0) {
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
      console.error('Failed to load product details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  function getPrice(variant) {
    return variant ? parseFloat(variant.retail_price) || 0 : 0;
  }

  function getVariantImage(variant, fallback) {
    if (!variant) return fallback;
    const previewFile = variant.files?.find(f => f.type === 'preview');
    if (previewFile?.preview_url) return previewFile.preview_url;
    if (variant.files?.[0]?.preview_url) return variant.files[0].preview_url;
    if (variant.product?.image) return variant.product.image;
    return fallback;
  }

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedItem) return;
    const provider = productDetails?.provider || selectedItem.provider || 'printful';
    addItem(
      { id: selectedItem.isPrintify ? selectedItem.printifyId : selectedItem.id, name: selectedItem.name, image: getVariantImage(selectedVariant, selectedItem.image) },
      selectedVariant,
      provider
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Separate adult products from kids
  const adultProducts = products.filter(p => !p.name?.toLowerCase().includes('kid'));
  const allAdultItems = adultProducts;

  // Organize into sections
  const getSection = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('hoodie') || n.includes('zip') || n.includes('jacket')) return 'hoodies';
    if (n.includes('tee') || n.includes('t-shirt')) return 'tees';
    if (n.includes('tank') || n.includes('crop')) return 'tops';
    if (n.includes('legging') || n.includes('jogger') || n.includes('short') || n.includes('bra') || n.includes('pant')) return 'activewear';
    if (n.includes('hat') || n.includes('bucket') || n.includes('cap') || n.includes('headband')) return 'headwear';
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

  const filteredItems = activeCategory === 'all'
    ? allAdultItems
    : activeCategory === 'kids'
    ? KIDS_ITEMS
    : allAdultItems.filter(item => {
        if (activeCategory === 'apparel') return ['hoodies', 'tees', 'tops'].includes(getSection(item.name));
        if (activeCategory === 'activewear') return ['activewear'].includes(getSection(item.name));
        if (activeCategory === 'accessories') return ['headwear', 'bags', 'essentials', 'other'].includes(getSection(item.name));
        return true;
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
      `}</style>

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
                <img src="/images/merch/idmg-black-hoodie.jpg" alt="IDMG The Label" className="w-full h-auto transition-transform duration-700 hover:scale-110" />
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
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $4</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">2 Tanks</h3>
              <p className="text-white/40 text-sm mb-3">Any 2 tank tops — mix IDMG, LOTL, or MPF</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$35.98</span>
                <span className="text-white/30 line-through text-sm">$39.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$19.99 each × 2 with 10% off</p>
            </div>

            {/* Deal 2: 2 Crop Tops */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👚</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $4</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">2 Crop Tops</h3>
              <p className="text-white/40 text-sm mb-3">Any 2 crop tops — IDMG or LOTL Festival</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$35.98</span>
                <span className="text-white/30 line-through text-sm">$39.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$19.99 each × 2 with 10% off</p>
            </div>

            {/* Deal 3: Sock + Tote Duo */}
            <div className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🧦</span>
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">SAVE $3</span>
              </div>
              <h3 className="text-lg font-black text-white mb-1">Socks + Tote</h3>
              <p className="text-white/40 text-sm mb-3">Crew socks + tote bag combo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-green-400">$26.98</span>
                <span className="text-white/30 line-through text-sm">$29.98</span>
              </div>
              <p className="text-white/30 text-xs mt-1">$14.99 each × 2 with 10% off</p>
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
                <span className="text-2xl font-black text-purple-400">$85.69</span>
                <span className="text-white/30 line-through text-sm">$100.81</span>
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
                <span className="text-2xl font-black text-pink-400">$103.53</span>
                <span className="text-white/30 line-through text-sm">$121.80</span>
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
              {loading ? 'Loading store...' : `${adultProducts.length + KIDS_ITEMS.length} items — Printed & shipped by Printful + Printify`}
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
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
            /* Kids-only view */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {KIDS_ITEMS.map((item, idx) => (
                <KidsCard key={item.id} item={item} idx={idx} />
              ))}
            </div>
          ) : activeCategory === 'all' ? (
            /* All Items — organized sections + kids at bottom */
            <>
              {sectionOrder.map(sec => {
                const items = sectionedProducts[sec.id];
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
                </div>
              </div>
            </>
          ) : (
            /* Filtered category view */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item, idx) => (
                <ProductCard key={item.id} item={item} idx={idx} onQuickView={handleQuickView} />
              ))}
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
              <div className={`flex flex-wrap gap-4 justify-center transition-all duration-700 delay-[900ms] ${ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
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
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[merch-fade-up_0.3s_ease-out]" onClick={() => { setSelectedItem(null); setProductDetails(null); setSelectedVariant(null); }}>
          <div className="glass rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ animation: 'merch-fade-scale 0.4s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="aspect-square relative bg-white">
                <ProductImage src={getVariantImage(selectedVariant, selectedItem.image)} fallbackSrc={selectedItem.printfulImage} alt={selectedItem.name} />
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
                      <label className="text-white/60 text-sm mb-3 block">Select Size ({productDetails.sync_variants?.length || 0} available)</label>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {productDetails.sync_variants?.map((variant) => (
                          <button key={variant.id} onClick={() => setSelectedVariant(variant)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${selectedVariant?.id === variant.id ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}>
                            <div className="flex justify-between items-center">
                              <span>{variant.name}</span>
                              <span className="font-bold">${getPrice(variant).toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
