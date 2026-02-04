/**
 * MYSTATION - Merch Page
 * Dynamic merchandise powered by Printful API
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Truck, Shield, Package, X, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';

// Product Image component with fallback
function ProductImage({ src, alt, className = '' }) {
  const [error, setError] = useState(false);

  if (error || !src) {
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
      src={src}
      alt={alt}
      className={`absolute inset-0 w-full h-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

// Loading skeleton for products
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

export default function MerchPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const slideInterval = useRef(null);
  const { addItem } = useCartStore();

  // Auto-rotate carousel
  useEffect(() => {
    if (products.length > 0) {
      slideInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length);
      }, 3000); // Change every 3 seconds
    }
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [products.length]);

  // Manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Reset interval when manually navigating
    if (slideInterval.current) clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 3000);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % products.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + products.length) % products.length);

  // Fetch products from Printful API
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/printful/products');
        const data = await res.json();

        if (data.success) {
          // Transform Printful products to our format
          const transformedProducts = data.products.map((p, index) => {
            // Use Printful's mockup images - they show actual products with our designs
            const productImage = getBrandedImage(p.name, p.thumbnail_url);

            return {
              id: p.id,
              name: p.name,
              description: getProductDescription(p.name),
              price: 0, // Will be set from variant
              category: getCategory(p.name),
              image: productImage,
              printfulImage: p.thumbnail_url,
              variants: p.variants,
              synced: p.synced,
              featured: index < 6, // First 6 are featured
              badge: getBadge(p.name),
            };
          });
          setProducts(transformedProducts);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Get product image - Use local mockups generated from Printful Mockup Generator API
  // These show actual products with our designs rendered on them
  function getBrandedImage(name, printfulUrl) {
    const lower = name.toLowerCase();

    // Use locally stored mockups (generated from Printful Mockup Generator API)
    // These show the actual products with designs printed on them

    // IDMG Hoodies
    if (lower.includes('idmg') && lower.includes('hoodie') && lower.includes('black')) {
      return '/images/mockups/idmg-hoodie-black.jpg';
    }
    if (lower.includes('idmg') && lower.includes('hoodie') && lower.includes('white')) {
      return '/images/mockups/idmg-hoodie-white.jpg';
    }

    // LOTL Hoodie
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('hoodie')) {
      return '/images/mockups/lotl-hoodie-black.jpg';
    }

    // IDMG The Label Tees (specific match first)
    if (lower.includes('idmg') && lower.includes('label')) {
      if (lower.includes('white')) {
        return '/images/mockups/idmg-label-tee-white.jpg';
      }
      return '/images/mockups/idmg-label-tee-black.jpg';
    }

    // IDMG Tees (circle logo)
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('black')) {
      return '/images/mockups/idmg-tee-black.jpg';
    }
    if (lower.includes('idmg') && (lower.includes('tee') || lower.includes('t-shirt')) && lower.includes('white')) {
      return '/images/mockups/idmg-tee-white.jpg';
    }

    // LOTL Tees
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && (lower.includes('tee') || lower.includes('t-shirt'))) {
      return '/images/mockups/lotl-tee-black.jpg';
    }

    // MPF Tee
    if ((lower.includes('mike page foundation') || lower.includes('mpf')) && !lower.includes('mug')) {
      return '/images/mockups/mpf-tee.jpg';
    }

    // LOTL Mugs
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('mug')) {
      if (lower.includes('white')) {
        return '/images/mockups/lotl-mug-white.jpg';
      }
      return '/images/mockups/lotl-mug-black.jpg';
    }

    // LOTL Tote Bag
    if ((lower.includes('lotl') || lower.includes('love on the lawn')) && lower.includes('tote')) {
      return '/images/mockups/lotl-tote.jpg';
    }

    // Fallback to old local images for products without mockups
    if (lower.includes('cap') || lower.includes('hat')) return '/images/merch/lotl-cap-final.jpg';
    if (lower.includes('hoodie')) return '/images/merch/idmg-black-hoodie.jpg';
    if (lower.includes('legging')) return '/images/merch/lotl-leggings-final.jpg';

    return '/images/merch/idmg-black-tee-real.jpg';
  }

  // Get product description based on name
  function getProductDescription(name) {
    const lower = name.toLowerCase();
    if (lower.includes('hoodie')) return 'Premium heavyweight hoodie with fleece lining. Street certified comfort.';
    if (lower.includes('t-shirt') || lower.includes('tee')) return 'Classic premium cotton tee. Essential streetwear.';
    if (lower.includes('legging')) return 'All-over print athletic leggings. Festival ready.';
    if (lower.includes('baby')) return 'Soft cotton baby tee. Rep the movement early.';
    return 'Premium quality merchandise from IDMG.';
  }

  // Get category based on product name
  function getCategory(name) {
    const lower = name.toLowerCase();
    if (lower.includes('cap') || lower.includes('hat')) return 'accessories';
    return 'apparel';
  }

  // Get badge based on product name
  function getBadge(name) {
    const lower = name.toLowerCase();
    if (lower.includes('lotl') || lower.includes('love on the lawn')) return 'LOTL';
    if (lower.includes('baby')) return 'NEW';
    return null;
  }

  // Fetch full product details when clicking
  async function handleQuickView(item) {
    setSelectedItem(item);
    setLoadingDetails(true);
    setProductDetails(null);
    setSelectedVariant(null);

    try {
      const res = await fetch(`/api/printful/products/${item.id}`);
      const data = await res.json();

      if (data.success && data.product) {
        setProductDetails(data.product);
        // Select first variant by default
        if (data.product.sync_variants && data.product.sync_variants.length > 0) {
          setSelectedVariant(data.product.sync_variants[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  // Extract sizes from variants
  function getSizes(variants) {
    if (!variants) return [];
    const sizes = [...new Set(variants.map(v => {
      const name = v.name || '';
      const parts = name.split(' / ');
      return parts[parts.length - 1] || 'One Size';
    }))];
    return sizes;
  }

  // Extract colors from variants
  function getColors(variants) {
    if (!variants) return [];
    const colors = [...new Set(variants.map(v => {
      const name = v.name || '';
      const parts = name.split(' / ');
      return parts[0] || 'Default';
    }))];
    return colors;
  }

  // Get price from variant
  function getPrice(variant) {
    if (!variant) return 0;
    return parseFloat(variant.retail_price) || 0;
  }

  // Get best image URL from variant
  function getVariantImage(variant, fallback) {
    if (!variant) return fallback;

    // Try to find preview file first
    const previewFile = variant.files?.find(f => f.type === 'preview');
    if (previewFile?.preview_url) return previewFile.preview_url;

    // Try first file's preview_url
    if (variant.files?.[0]?.preview_url) return variant.files[0].preview_url;

    // Try product image from variant
    if (variant.product?.image) return variant.product.image;

    // Try first file's thumbnail
    if (variant.files?.[0]?.thumbnail_url) return variant.files[0].thumbnail_url;

    return fallback;
  }

  // Handle add to cart
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedItem) return;

    const product = {
      id: selectedItem.id,
      name: selectedItem.name,
      image: getVariantImage(selectedVariant, selectedItem.image),
    };

    addItem(product, selectedVariant);
    setAddedToCart(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };

  // Filter products by category
  const filteredItems = activeCategory === 'all'
    ? products
    : products.filter(item => item.category === activeCategory);

  // Filter out leggings for featured, prioritize hoodies and tees
  const featuredItems = products
    .filter(item => !item.name.toLowerCase().includes('legging'))
    .slice(0, 6);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'apparel', label: 'Apparel' },
    { id: 'accessories', label: 'Accessories' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/60 to-pink-900/50" />
        <div className="bg-orb w-[600px] h-[600px] bg-fuchsia-500 top-[-200px] left-[-200px]" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-500 top-[100px] right-[-150px]" style={{ animationDelay: '-3s' }} />
        <div className="bg-orb w-[400px] h-[400px] bg-cyan-400 bottom-[-100px] left-[30%]" style={{ animationDelay: '-7s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Auto-Playing Product Carousel */}
            <div className="relative">
              <div className="w-72 h-80 lg:w-96 lg:h-[420px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
                <div className="relative w-full h-full glass rounded-3xl overflow-hidden border border-white/20">
                  {/* Carousel Images */}
                  {products.length > 0 ? (
                    products.map((product, index) => (
                      <div
                        key={product.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                          index === currentSlide
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-95'
                        }`}
                      >
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                        />
                        {/* Product Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                          <p className="text-white font-bold text-lg">{product.name}</p>
                          <p className="text-white/60 text-sm">{product.synced} variants</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <ProductImage
                      src="/images/merch/idmg-black-hoodie.jpg"
                      alt="Featured Product"
                    />
                  )}

                  {/* Navigation Arrows */}
                  {products.length > 1 && (
                    <>
                      <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all z-10"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                {/* Slide Indicators */}
                {products.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {products.slice(0, 11).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide
                            ? 'bg-blue-500 w-6'
                            : 'bg-white/30 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
                <ShoppingBag size={16} className="text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Official Merchandise</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Mike Page<br />
                <span className="gradient-text">Merch</span>
              </h1>
              <p className="text-xl text-white/50 mb-8 max-w-lg">
                Rep the movement. 100% of proceeds support youth music programs through the Mike Page Foundation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a
                  href="https://cash.app/$RIDE4PAGEMUSIC847"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <Heart size={18} />
                  Donate Direct
                </a>
                <Link href="#shop" className="btn-secondary flex items-center gap-2">
                  <ShoppingBag size={18} />
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 border-y border-white/5">
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

      {/* Featured Items */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-pink-900/20" />
        <div className="bg-orb w-[350px] h-[350px] bg-cyan-500 top-[-100px] right-[20%] opacity-30" style={{ animationDelay: '-2s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Drops</h2>
              <p className="text-white/40">Most popular items from the collection</p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              featuredItems.map((item, i) => (
                <div
                  key={item.id}
                  className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  onClick={() => handleQuickView(item)}
                >
                  {/* Product Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <ProductImage src={item.image} alt={item.name} />
                    {item.badge && (
                      <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                        item.badge === 'NEW' ? 'bg-blue-500 text-white' :
                        item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {item.badge}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <button className="px-6 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform">
                        Quick View
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-white/40 text-sm mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white/60">{item.synced} variants</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Full Shop */}
      <section id="shop" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-blue-900/20 to-mystation-black" />
        <div className="bg-orb w-[400px] h-[400px] bg-pink-500 top-[20%] left-[-100px] opacity-50" />
        <div className="bg-orb w-[300px] h-[300px] bg-blue-400 bottom-[10%] right-[-50px] opacity-40" style={{ animationDelay: '-4s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">Full Collection</h2>
            <p className="text-white/50">
              {products.length} products powered by Printful
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
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

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(9)].map((_, i) => <ProductSkeleton key={i} />)
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                  onClick={() => handleQuickView(item)}
                >
                  {/* Product Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <ProductImage src={item.image} alt={item.name} />
                    {item.badge && (
                      <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                        item.badge === 'NEW' ? 'bg-blue-500 text-white' :
                        item.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {item.badge}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                        View Details
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-white/40 text-sm mb-3">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">{item.synced} variants</span>
                      <button className="px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition">
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="glass rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
            <div className="relative">
              <Image
                src="/images/mpf-logo.png"
                alt="Mike Page Foundation"
                width={80}
                height={80}
                className="mx-auto mb-6"
              />
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Every Purchase Supports the Mission
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                The Mike Page Foundation is a 501(c)(3) nonprofit dedicated to youth music education,
                scholarships, and community programs like Love on the Lawn.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/about" className="btn-primary">
                  Learn About the Foundation
                </Link>
                <a
                  href="https://cash.app/$RIDE4PAGEMUSIC847"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <Heart size={18} />
                  Donate Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setSelectedItem(null);
            setProductDetails(null);
            setSelectedVariant(null);
          }}
        >
          <div
            className="glass rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="aspect-square relative bg-white">
                <ProductImage
                  src={getVariantImage(selectedVariant, selectedItem.image)}
                  alt={selectedItem.name}
                />
                {selectedItem.badge && (
                  <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
                    selectedItem.badge === 'NEW' ? 'bg-blue-500 text-white' :
                    selectedItem.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {selectedItem.badge}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-6 lg:p-8 relative">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setProductDetails(null);
                    setSelectedVariant(null);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition"
                >
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
                    <p className="text-3xl font-black text-white mb-6">
                      ${selectedVariant ? getPrice(selectedVariant).toFixed(2) : '---'}
                    </p>

                    {/* Variant Selection */}
                    <div className="mb-6">
                      <label className="text-white/60 text-sm mb-3 block">
                        Select Variant ({productDetails.sync_variants?.length || 0} available)
                      </label>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {productDetails.sync_variants?.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition ${
                              selectedVariant?.id === variant.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{variant.name}</span>
                              <span className="font-bold">${getPrice(variant).toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button
                        onClick={handleAddToCart}
                        disabled={!selectedVariant || addedToCart}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition ${
                          addedToCart
                            ? 'bg-green-500 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                        }`}
                      >
                        {addedToCart ? (
                          <>
                            <Check size={18} />
                            Added to Cart!
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={18} />
                            Add to Cart - ${selectedVariant ? getPrice(selectedVariant).toFixed(2) : '---'}
                          </>
                        )}
                      </button>
                      <p className="text-center text-white/40 text-xs">
                        Secure checkout powered by Printful
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-white/40 py-8">Unable to load product details</p>
                )}

                {/* Trust badges */}
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
