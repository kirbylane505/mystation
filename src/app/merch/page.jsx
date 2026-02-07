/**
 * MYSTATION - Merch Page
 * IDMG The Label + Mike Page Foundation — One Stop Shop
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Truck, Shield, Package, X, Loader2, Check, Ticket, Sparkles } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

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

// Hardcoded catalog items (new product photos)
const CATALOG_ITEMS = [
  {
    id: 'cat-shortset',
    name: 'IDMG Short Set Collection',
    description: 'Crewneck + shorts. 9 colorways.',
    image: '/images/merch/catalog/idmg-shortset-9colors.png',
    category: 'apparel',
    colors: 'White / Black / Yellow / Red / Navy / Grey / Olive / Blue / Cream',
    badge: 'NEW',
  },
  {
    id: 'cat-shortset-model',
    name: 'IDMG Short Set - Modeled',
    description: 'White, Black & Red lifestyle shots.',
    image: '/images/merch/catalog/idmg-shortset-3panel.png',
    category: 'apparel',
    badge: 'NEW',
  },
  {
    id: 'cat-tracksuit',
    name: 'IDMG Tracksuit Collection',
    description: 'Hoodie + jogger set. Premium fleece.',
    image: '/images/merch/catalog/idmg-tracksuit-4colors.png',
    category: 'apparel',
    colors: 'White / Red / Gold / Navy',
    badge: 'NEW',
  },
  {
    id: 'cat-onesie-adult',
    name: 'IDMG Onesie Collection',
    description: 'Full-body zip hoodie onesie. Cozy luxury.',
    image: '/images/merch/catalog/idmg-onesie-4colors.png',
    category: 'apparel',
    colors: 'White / Red / Gold / Navy',
    badge: 'NEW',
  },
  {
    id: 'cat-shortset-solo',
    name: 'IDMG Short Set - White',
    description: 'Clean white crewneck + shorts set.',
    image: '/images/merch/catalog/idmg-shortset-white-solo.png',
    category: 'apparel',
  },
  {
    id: 'cat-shortset-couple',
    name: 'IDMG His & Hers Set',
    description: 'Matching white short sets. His & Hers.',
    image: '/images/merch/catalog/idmg-shortset-couple.png',
    category: 'apparel',
  },
  {
    id: 'cat-mpf-hoodies',
    name: 'MPF Hoodies - Black & White',
    description: 'Heavyweight hoodie with heart logo.',
    image: '/images/merch/catalog/mpf-hoodies-bw.png',
    category: 'apparel',
    badge: 'MPF',
  },
  {
    id: 'cat-mpf-crewneck',
    name: 'MPF Crewneck',
    description: 'Classic crewneck. Heart logo center chest.',
    image: '/images/merch/catalog/mpf-crewneck-black.png',
    category: 'apparel',
    badge: 'MPF',
  },
  {
    id: 'cat-mpf-essentials',
    name: 'MPF Essentials Trio',
    description: 'Black tee, white tee & crewneck bundle.',
    image: '/images/merch/catalog/mpf-collection-trio.png',
    category: 'apparel',
    badge: 'MPF',
  },
  {
    id: 'cat-kids-onesie',
    name: 'IDMG Kids Onesie',
    description: 'Zip-up hooded onesie for little ones.',
    image: '/images/merch/catalog/idmg-kids-onesie-black.png',
    category: 'kids',
    badge: 'KIDS',
  },
];

// Kids items with Stripe checkout links
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
        const res = await fetch('/api/printful/products');
        const data = await res.json();
        if (data.success) {
          const filteredPrintful = data.products.filter((p) => !p.name.toLowerCase().includes('mug'));
          const transformedProducts = filteredPrintful.map((p) => ({
            id: p.id,
            name: p.name,
            description: getProductDescription(p.name),
            category: getCategory(p.name),
            image: getBrandedImage(p.name, p.thumbnail_url),
            printfulImage: p.thumbnail_url,
            variants: p.variants,
            synced: p.synced,
            badge: getBadge(p.name),
            isPrintful: true,
          }));
          setProducts(transformedProducts);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  function getBrandedImage(name, printfulUrl) {
    const lower = name.toLowerCase();
    if (lower.includes('idmg') && lower.includes('hoodie') && lower.includes('black')) return '/images/mockups/idmg-hoodie-black.jpg';
    if (lower.includes('idmg') && lower.includes('hoodie') && lower.includes('white')) return '/images/mockups/idmg-hoodie-white.jpg';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('hoodie')) return '/images/mockups/lotl-hoodie-black.jpg';
    if (lower.includes('idmg') && lower.includes('label')) {
      if (lower.includes('white')) return '/images/mockups/idmg-label-tee-white.jpg';
      return '/images/mockups/idmg-tee-black.jpg';
    }
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('black')) return '/images/mockups/idmg-tee-black.jpg';
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('white')) return '/images/mockups/idmg-tee-white.jpg';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('tee') || lower.includes('t-shirt'))) return '/images/mockups/lotl-tee-black.jpg';
    if ((lower.includes('mike page foundation') || lower.includes('mpf')) && !lower.includes('mug') && !lower.includes('sweater')) return '/images/merch/catalog/mpf-collection-trio.png';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('mug')) return printfulUrl || '/images/mockups/lotl-mug-black.jpg';
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('tote')) return '/images/mockups/lotl-tote.jpg';
    if (lower.includes('cap') || lower.includes('hat')) return '/images/merch/lotl-cap-final.jpg';
    if (lower.includes('hoodie')) return '/images/merch/idmg-black-hoodie.jpg';
    if (lower.includes('legging')) return '/images/merch/lotl-leggings-final.jpg';
    return printfulUrl || '/images/merch/idmg-black-tee-real.jpg';
  }

  function getProductDescription(name) {
    const lower = name.toLowerCase();
    if (lower.includes('hoodie')) return 'Premium heavyweight hoodie. Street certified.';
    if (lower.includes('t-shirt') || lower.includes('tee')) return 'Classic premium cotton tee.';
    if (lower.includes('mug')) return 'Ceramic mug. Rep the movement daily.';
    if (lower.includes('tote')) return 'Premium canvas tote bag.';
    if (lower.includes('cap') || lower.includes('hat')) return 'Structured snapback cap.';
    return 'Premium merchandise from IDMG.';
  }

  function getCategory(name) {
    const lower = name.toLowerCase();
    if (lower.includes('cap') || lower.includes('hat') || lower.includes('mug') || lower.includes('tote')) return 'accessories';
    return 'apparel';
  }

  function getBadge(name) {
    const lower = name.toLowerCase();
    if (lower.includes('lotl') || lower.includes('love on the lawn')) return 'LOTL';
    if (lower.includes('mpf') || lower.includes('mike page foundation')) return 'MPF';
    return null;
  }

  async function handleQuickView(item) {
    if (!item.isPrintful) return; // catalog items don't have Printful details
    setSelectedItem(item);
    setLoadingDetails(true);
    setProductDetails(null);
    setSelectedVariant(null);
    try {
      const res = await fetch(`/api/printful/products/${item.id}`);
      const data = await res.json();
      if (data.success && data.product) {
        setProductDetails(data.product);
        if (data.product.sync_variants?.length > 0) setSelectedVariant(data.product.sync_variants[0]);
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
    addItem({ id: selectedItem.id, name: selectedItem.name, image: getVariantImage(selectedVariant, selectedItem.image) }, selectedVariant);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Combine all items for the unified shop
  const allItems = [...CATALOG_ITEMS, ...KIDS_ITEMS, ...products];
  const filteredItems = activeCategory === 'all'
    ? allItems
    : allItems.filter(item => item.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'apparel', label: 'Apparel' },
    { id: 'accessories', label: 'Accessories' },
    { id: 'kids', label: 'Kids' },
  ];

  return (
    <div className="min-h-screen">

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/60 to-pink-900/50" />
        <div className="bg-orb w-[600px] h-[600px] bg-fuchsia-500 top-[-200px] left-[-200px]" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-500 top-[100px] right-[-150px]" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Hero Image */}
            <div className="relative w-full max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                <img src="/images/merch/catalog/idmg-shortset-couple.png" alt="IDMG The Label" className="w-full h-auto" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <p className="text-white/60 text-sm font-medium uppercase tracking-wider">New 2026 Collection</p>
                  <p className="text-white font-black text-2xl">IDMG The Label</p>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <div className="text-center lg:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
                <ShoppingBag size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Official Merchandise</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
                Mike Page<br /><span className="gradient-text">Merch</span>
              </h1>
              <p className="text-lg text-white/50 mb-6 max-w-lg">
                Adults. Teens. Toddlers. The whole family can rep the movement. 100% of proceeds support youth music programs.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link href="#shop" className="btn-primary flex items-center gap-2">
                  <ShoppingBag size={18} /> Shop Now
                </Link>
                <a href="https://cash.app/$RIDE4PAGEMUSIC847" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
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
              <div key={i} className="flex items-center gap-3 text-white/50">
                <item.icon size={20} className="text-blue-400" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LOTL 2026 PROMO BANNER ============ */}
      <section className="py-6">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 p-[2px]">
            <div className="relative bg-gradient-to-r from-green-900/95 via-emerald-800/95 to-green-900/95 rounded-2xl px-6 py-5 md:px-10 md:py-6">
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                    <Ticket size={28} className="text-green-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles size={16} className="text-yellow-400" />
                      <span className="text-yellow-400 text-sm font-bold uppercase tracking-wider">Love on the Lawn 2026 Promo</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white">
                      Spend $26+ on merch &rarr; Get <span className="text-green-300">25% OFF</span> your LOTL tickets!
                    </h3>
                    <p className="text-green-200/70 text-sm mt-1">Discount code will appear on your receipt after checkout.</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Link href="#shop" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-green-500/30">
                    <ShoppingBag size={18} /> Shop & Save
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ONE SHOP — EVERYTHING ============ */}
      <section id="shop" className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-blue-900/20 to-mystation-black" />
        <div className="bg-orb w-[400px] h-[400px] bg-pink-500 top-[20%] left-[-100px] opacity-50" />
        <div className="bg-orb w-[300px] h-[300px] bg-blue-400 bottom-[10%] right-[-50px] opacity-40" style={{ animationDelay: '-4s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Shop the Collection</h2>
            <p className="text-white/50">
              {loading ? 'Loading...' : `${allItems.length} items — IDMG The Label + Mike Page Foundation + LOTL`}
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

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Catalog + Kids items (always shown, not loading dependent) */}
            {filteredItems.filter(i => !i.isPrintful).map((item) => (
              <div key={item.id} className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300">
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="aspect-square relative overflow-hidden bg-white">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {item.badge && (
                        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                          item.badge === 'KIDS' ? 'bg-pink-500 text-white' :
                          item.badge === 'MPF' ? 'bg-red-500 text-white' :
                          item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>{item.badge}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-white/40 text-xs mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-white">{item.price}</span>
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">Buy Now</span>
                      </div>
                    </div>
                  </a>
                ) : (
                  <>
                    <div className="aspect-square relative overflow-hidden bg-white">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {item.badge && (
                        <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                          item.badge === 'KIDS' ? 'bg-pink-500 text-white' :
                          item.badge === 'MPF' ? 'bg-red-500 text-white' :
                          item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>{item.badge}</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-white/40 text-xs mb-2">{item.description}</p>
                      {item.colors && <p className="text-white/30 text-xs">{item.colors}</p>}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Printful items */}
            {loading ? (
              [...Array(6)].map((_, i) => <ProductSkeleton key={`skel-${i}`} />)
            ) : (
              filteredItems.filter(i => i.isPrintful).map((item) => (
                <div
                  key={item.id}
                  className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleQuickView(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ProductImage src={item.image} fallbackSrc={item.printfulImage} alt={item.name} />
                    {item.badge && (
                      <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                        item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                        item.badge === 'MPF' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>{item.badge}</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <span className="px-6 py-3 bg-white text-black font-bold rounded-full">Quick View</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-white/40 text-xs mb-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">{item.synced} variants</span>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg">Select</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="glass rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative">
              <Image src="/images/mpf-logo.png" alt="Mike Page Foundation" width={80} height={80} className="mx-auto mb-6" />
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">Every Purchase Supports the Mission</h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                The Mike Page Foundation is a 501(c)(3) nonprofit dedicated to youth music education,
                scholarships, and community programs like Love on the Lawn.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/about" className="btn-primary">Learn About the Foundation</Link>
                <a href="https://cash.app/$RIDE4PAGEMUSIC847" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
                  <Heart size={18} /> Donate Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ QUICK VIEW MODAL ============ */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedItem(null); setProductDetails(null); setSelectedVariant(null); }}>
          <div className="glass rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
                    <span className="text-white/60">Loading variants...</span>
                  </div>
                ) : productDetails ? (
                  <>
                    <p className="text-3xl font-black text-white mb-6">${selectedVariant ? getPrice(selectedVariant).toFixed(2) : '---'}</p>
                    <div className="mb-6">
                      <label className="text-white/60 text-sm mb-3 block">Select Variant ({productDetails.sync_variants?.length || 0} available)</label>
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
                    <p className="text-center text-white/40 text-xs mt-2">Secure checkout powered by Printful</p>
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
