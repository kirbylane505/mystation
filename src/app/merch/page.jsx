/**
 * MYSTATION - Merch Page
 * Mike Page Official Merchandise with Real Product Images
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Heart, Truck, Shield, Package, X } from 'lucide-react';

// Merch items with real product images
// Add your product photos to /public/images/merch/
const merchItems = [
  {
    id: 1,
    name: 'IDMG Black Tee',
    description: 'Classic black premium cotton tee with white IDMG logo. Street certified.',
    price: 28,
    category: 'apparel',
    image: '/images/merch/idmg-black-tee-new.jpg',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: true,
    badge: 'BESTSELLER',
  },
  {
    id: 2,
    name: 'IDMG White Tee',
    description: 'Clean white premium cotton tee with the IDMG logo. The essentials.',
    price: 28,
    category: 'apparel',
    image: '/images/merch/idmg-white-tee.jpg',
    colors: ['White'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: true,
    badge: 'BESTSELLER',
  },
  {
    id: 3,
    name: 'IDMG Black Hoodie',
    description: 'Heavyweight black hoodie with white IDMG logo. Fleece lined, street ready.',
    price: 50,
    category: 'apparel',
    image: '/images/merch/idmg-black-hoodie.jpg',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 4,
    name: 'IDMG White Hoodie',
    description: 'Heavyweight white hoodie with IDMG logo. Premium fleece lined comfort.',
    price: 50,
    category: 'apparel',
    image: '/images/merch/idmg-white-hoodie.jpg',
    colors: ['White'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: false,
  },
  {
    id: 5,
    name: 'LOTL Black Hoodie',
    description: 'Love on the Lawn festival hoodie. Heavyweight fleece with full color logo.',
    price: 55,
    category: 'apparel',
    image: '/images/merch/lotl-black-hoodie.jpg',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 6,
    name: 'LOTL Leggings',
    description: 'All-over print leggings with Love on the Lawn pattern. Festival ready.',
    price: 45,
    category: 'apparel',
    image: '/images/merch/lotl-leggings-final.jpg',
    colors: ['Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 7,
    name: 'LOTL Cap',
    description: 'Love on the Lawn logo centered on premium dad cap. Adjustable strap.',
    price: 30,
    category: 'accessories',
    image: '/images/merch/lotl-cap-final.jpg',
    colors: ['Black'],
    sizes: ['One Size'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 8,
    name: 'IDMG Leggings',
    description: 'Women\'s athletic leggings with IDMG logo waistband. Premium stretch fabric.',
    price: 42,
    category: 'apparel',
    image: '/images/merch/idmg-leggings.jpg',
    colors: ['Black'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 9,
    name: 'IDMG Tracksuit',
    description: 'Full IDMG tracksuit set. Matching jacket and joggers. Premium athletic fit.',
    price: 120,
    category: 'apparel',
    image: '/images/merch/idmg-tracksuit.jpg',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: true,
    badge: 'NEW',
  },
  {
    id: 10,
    name: 'IDMG Tech Suit',
    description: 'IDMG tech fleece set with hoodie. Full zip jacket and matching joggers.',
    price: 135,
    category: 'apparel',
    image: '/images/merch/idmg-tracksuit-2.jpg',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    featured: true,
    badge: 'NEW',
  },
];

const categories = [
  { id: 'all', label: 'All Items' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'accessories', label: 'Accessories' },
];

// Product Image component with fallback
function ProductImage({ src, alt, className = '' }) {
  const [error, setError] = useState(false);

  if (error) {
    // Fallback placeholder when image doesn't exist
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

export default function MerchPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const filteredItems = activeCategory === 'all'
    ? merchItems
    : merchItems.filter(item => item.category === activeCategory);

  const featuredItems = merchItems.filter(item => item.featured);

  const handleQuickView = (item) => {
    setSelectedItem(item);
    setSelectedSize(item.sizes[0]);
    setSelectedColor(item.colors[0]);
  };

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
            {/* Hero Image */}
            <div className="relative">
              <div className="w-72 h-80 lg:w-96 lg:h-[420px] relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
                <div className="relative w-full h-full glass rounded-3xl overflow-hidden border border-white/20">
                  <ProductImage
                    src="/images/merch/idmg-black-hoodie.jpg"
                    alt="IDMG Black Hoodie"
                  />
                </div>
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
              { icon: Package, label: 'Premium Quality' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/50">
                <item.icon size={20} className="text-blue-400" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Photo Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-pink-900/20 to-purple-900/20" />
        <div className="bg-orb w-[300px] h-[300px] bg-orange-400 top-[50%] left-[-50px] opacity-40" style={{ animationDelay: '-6s' }} />
        <div className="relative max-w-screen-xl mx-auto px-6">
          <div className="glass rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="relative aspect-square lg:aspect-auto min-h-[300px] bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <img
                  src="/images/idmg-logo-white.png"
                  alt="IDMG Logo"
                  className="w-48 h-48 object-contain opacity-80"
                />
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <span className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-4">The Movement</span>
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                  Worn By The<br />
                  <span className="gradient-text">IDMG Family</span>
                </h2>
                <p className="text-white/50 mb-6">
                  Real artists. Real supporters. When you rock Mike Page merch, you're part of something bigger than fashion - you're supporting youth music programs and community events across Chicago.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-mystation-black flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{i}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-white/40 text-sm">500+ supporters worldwide</span>
                </div>
              </div>
            </div>
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
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => (
              <div
                key={item.id}
                className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => handleQuickView(item)}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                  />
                  {/* Badge */}
                  {item.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                      item.badge === 'NEW' ? 'bg-blue-500 text-white' :
                      item.badge === 'LIMITED' ? 'bg-purple-500 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {item.badge}
                    </div>
                  )}
                  {/* Quick View Overlay */}
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
                    <span className="text-2xl font-black text-white">${item.price}</span>
                    <div className="flex gap-1">
                      {item.colors.slice(0, 3).map((color, ci) => (
                        <div
                          key={ci}
                          className="w-5 h-5 rounded-full border-2 border-white/20"
                          style={{
                            background: color === 'Black' ? '#1a1a1a' :
                                        color === 'White' ? '#f5f5f5' :
                                        color === 'Navy' ? '#1e3a5f' : '#888'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
            <p className="text-white/50">Premium merch supporting the Mike Page Foundation</p>
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
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 cursor-pointer"
                onClick={() => handleQuickView(item)}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  <ProductImage
                    src={item.image}
                    alt={item.name}
                  />
                  {item.badge && (
                    <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                      item.badge === 'NEW' ? 'bg-blue-500 text-white' :
                      item.badge === 'LIMITED' ? 'bg-purple-500 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {item.badge}
                    </div>
                  )}
                  {/* Hover overlay */}
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
                    <span className="text-2xl font-black text-white">${item.price}</span>
                    <button className="px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 transition">
                      Select
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="glass rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="aspect-square relative">
                <ProductImage
                  src={selectedItem.image}
                  alt={selectedItem.name}
                />
                {selectedItem.badge && (
                  <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full ${
                    selectedItem.badge === 'NEW' ? 'bg-blue-500 text-white' :
                    selectedItem.badge === 'LIMITED' ? 'bg-purple-500 text-white' :
                    'bg-orange-500 text-white'
                  }`}>
                    {selectedItem.badge}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-6 lg:p-8 relative">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition"
                >
                  <X size={20} />
                </button>

                <h2 className="text-2xl font-black text-white mb-2 pr-12">{selectedItem.name}</h2>
                <p className="text-white/50 mb-4">{selectedItem.description}</p>
                <p className="text-3xl font-black text-white mb-6">${selectedItem.price}</p>

                {/* Color Selection */}
                <div className="mb-5">
                  <label className="text-white/60 text-sm mb-3 block">Color: <span className="text-white font-medium">{selectedColor}</span></label>
                  <div className="flex gap-2">
                    {selectedItem.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          selectedColor === color
                            ? 'border-blue-500 scale-110'
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        style={{
                          background: color === 'Black' ? '#1a1a1a' :
                                      color === 'White' ? '#f5f5f5' :
                                      color === 'Navy' ? '#1e3a5f' : '#888'
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="mb-6">
                  <label className="text-white/60 text-sm mb-3 block">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-12 px-3 rounded-lg text-sm font-bold transition ${
                          selectedSize === size
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <a
                    href={`https://cash.app/$RIDE4PAGEMUSIC847?amount=${selectedItem.price}&note=${encodeURIComponent(`${selectedItem.name} - ${selectedColor} - ${selectedSize}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4"
                  >
                    <ShoppingBag size={18} />
                    Buy Now - ${selectedItem.price}
                  </a>
                  <p className="text-center text-white/40 text-xs">
                    Pay via CashApp, then DM @mikepagelivin on Instagram with your order: {selectedColor} {selectedSize}
                  </p>
                </div>

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
