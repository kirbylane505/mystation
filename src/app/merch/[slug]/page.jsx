/**
 * MYSTATION - Individual Merch Product Page
 * Shareable URL: mystationlive.com/merch/[slug]
 * Full product details with image, variants, size/color selectors, add to cart
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Share2, Check, Loader2, Truck, Shield, Package, ChevronRight, Copy, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import {
  generateSlug,
  resolveColorHex,
  parseVariantTitle,
  parseVariantGroups,
  getVariantInfo,
  getProductDescription,
  getBadge,
  getBrandedImage,
  getModalImage,
  PRINTIFY_NAME_FIX,
  SIZE_ORDER,
} from '@/lib/merch-utils';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

// Hidden products (same filters as merch page)
const HIDDEN_PRINTFUL = ['bomber jacket', 'athletic short', 'windbreaker', 'track pants', 'track jacket', 'mesh short', 'wide-leg'];
const HIDDEN_PRINTIFY = ['jogger', 'sweatpant', 'track pant', 'bike short', 'legging', 'copy of'];

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center p-4">
          <ShoppingBag size={64} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">Image Coming Soon</p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function MerchProductPage({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  const [product, setProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Selection state
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch all products and find matching one by slug
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const [printfulRes, printifyRes] = await Promise.all([
          fetch('/api/printful/products'),
          fetch('/api/printify/products'),
        ]);
        const [printfulData, printifyData] = await Promise.all([
          printfulRes.json(),
          printifyRes.json(),
        ]);

        let allProducts = [];

        // Printful products
        if (printfulData.success) {
          const filtered = printfulData.products.filter(p => {
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
                  const prices = variants.map(v => parseFloat(v.retail_price)).filter(pr => pr > 0);
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

          const seen = new Map();
          for (const p of withPrices) {
            const key = p.name.toLowerCase();
            if (!seen.has(key) || p.synced > seen.get(key).synced) {
              seen.set(key, p);
            }
          }
          allProducts = Array.from(seen.values());
        }

        // Printify products
        if (printifyData.success && !printifyData.demo) {
          const printifyProducts = printifyData.products.filter(p => {
            const lower = (p.title || '').toLowerCase();
            return !HIDDEN_PRINTIFY.some(ex => lower.includes(ex));
          }).map(p => {
            const enabledVariants = (p.variants || []).filter(v => v.is_enabled !== false);
            const prices = enabledVariants.map(v => v.price / 100).filter(pr => pr > 0);
            const startingPrice = prices.length > 0 ? Math.min(...prices) : null;
            const defaultImg = (p.images || []).find(img => img.is_default);
            const firstImg = (p.images || [])[0];
            const image = defaultImg?.src || firstImg?.src || null;
            const rawName = p.title || 'Printify Product';
            const name = PRINTIFY_NAME_FIX[rawName] || rawName;
            const varInfo = getVariantInfo(enabledVariants);

            return {
              id: `printify_${p.id}`,
              printifyId: p.id,
              name,
              description: (p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200) || getProductDescription(name),
              image,
              printfulImage: null,
              variants: enabledVariants,
              synced: enabledVariants.length,
              sizeCount: varInfo.sizes.length,
              colorCount: varInfo.colors.length,
              badge: getBadge(name) || 'NEW',
              startingPrice,
              provider: 'printify',
              isPrintify: true,
            };
          });
          allProducts = [...allProducts, ...printifyProducts];
        }

        // Find the product matching the slug
        const match = allProducts.find(p => generateSlug(p.name) === slug);
        if (!match) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProduct(match);

        // Get related products (same category/brand, excluding current)
        const matchBrand = match.name.toLowerCase().includes('idmg') ? 'idmg' :
                          match.name.toLowerCase().includes('lotl') || match.name.toLowerCase().includes('love on the lawn') ? 'lotl' :
                          match.name.toLowerCase().includes('mpf') ? 'mpf' : null;
        const related = allProducts
          .filter(p => p.id !== match.id && (matchBrand ? p.name.toLowerCase().includes(matchBrand) : true))
          .slice(0, 4);
        setRelatedProducts(related.length >= 2 ? related : allProducts.filter(p => p.id !== match.id).slice(0, 4));

        // Fetch full product details for variants
        await fetchDetails(match);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  async function fetchDetails(item) {
    try {
      if (item.isPrintify) {
        const res = await fetch(`/api/printify/products/${item.printifyId}`);
        const data = await res.json();
        if (data.success && data.product) {
          const enabledVariants = (data.product.variants || []).filter(v => v.is_enabled !== false);
          const details = {
            ...data.product,
            sync_variants: enabledVariants.map(v => ({
              id: v.id,
              name: v.title,
              retail_price: (v.price / 100).toFixed(2),
              printifyVariantId: v.id,
              printifyProductId: data.product.id,
            })),
            provider: 'printify',
          };
          setProductDetails(details);
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
        const res = await fetch(`/api/printful/products/${item.id}`);
        const data = await res.json();
        if (data.success && data.product) {
          setProductDetails({ ...data.product, provider: 'printful' });
          if (data.product.sync_variants?.length > 0) {
            setSelectedVariant(data.product.sync_variants[0]);
          }
        }
      }
    } catch {}
  }

  // Handle size selection
  function handleSizeSelect(size) {
    setSelectedSize(size);
    const variants = productDetails?.sync_variants || [];
    if (selectedColor) {
      const match = variants.find(v => {
        const parsed = parseVariantTitle(v.name);
        return parsed.size === size && parsed.color === selectedColor;
      });
      if (match) setSelectedVariant(match);
    } else {
      const match = variants.find(v => {
        const parsed = parseVariantTitle(v.name);
        return parsed.size === size;
      });
      if (match) setSelectedVariant(match);
    }
  }

  // Handle color selection
  function handleColorSelect(color) {
    setSelectedColor(color);
    const variants = productDetails?.sync_variants || [];
    if (selectedSize) {
      const match = variants.find(v => {
        const parsed = parseVariantTitle(v.name);
        return parsed.color === color && parsed.size === selectedSize;
      });
      if (match) setSelectedVariant(match);
    } else {
      const match = variants.find(v => {
        const parsed = parseVariantTitle(v.name);
        return parsed.color === color;
      });
      if (match) {
        setSelectedVariant(match);
        const parsed = parseVariantTitle(match.name);
        if (parsed.size) setSelectedSize(parsed.size);
      }
    }
  }

  function handleAddToCart() {
    if (!selectedVariant || !product) return;
    const provider = productDetails?.provider || product.provider || 'printful';
    const productForCart = {
      id: product.isPrintify ? product.printifyId : product.id,
      name: product.name,
      image: getModalImage(selectedVariant, product, productDetails),
    };
    addItem(productForCart, selectedVariant, provider);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  }

  function handleShare() {
    setShowShareModal(true);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/merch/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Get variant info for selectors
  const variants = productDetails?.sync_variants || [];
  const varInfo = getVariantInfo(variants);
  const { sizes, colors } = varInfo;
  const currentPrice = selectedVariant ? parseFloat(selectedVariant.retail_price) || 0 : product?.startingPrice || 0;
  const currentImage = product ? getModalImage(selectedVariant, product, productDetails) : null;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d0d2b] to-[#0a0a1a] flex items-center justify-center pt-24">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d0d2b] to-[#0a0a1a] flex items-center justify-center pt-24">
        <div className="text-center max-w-md mx-auto px-6">
          <ShoppingBag size={64} className="text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
          <p className="text-white/50 mb-6">This product may have been removed or the link is incorrect.</p>
          <Link href="/merch" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-colors">
            <ArrowLeft size={18} />
            Back to All Merch
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d0d2b] to-[#0a0a1a] pt-24 pb-32">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white/60 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href="/merch" className="hover:text-white/60 transition-colors">Merch</Link>
          <ChevronRight size={14} />
          <span className="text-white/70">{product.name}</span>
        </nav>
      </div>

      {/* Product Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative group">
              <Zoom>
                <ProductImage src={currentImage} alt={product.name} />
              </Zoom>
              {product.badge && (
                <div className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full z-10 ${
                  product.badge === 'LOTL' ? 'bg-purple-500 text-white' :
                  product.badge === 'MPF' ? 'bg-red-500 text-white' :
                  product.badge === 'NEW' ? 'bg-green-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {product.badge}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{product.name}</h1>
            <p className="text-white/50 text-base mb-6">{product.description}</p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-black text-white">
                ${currentPrice.toFixed(2)}
              </span>
              {product.startingPrice && currentPrice > product.startingPrice && (
                <span className="text-white/40 text-sm ml-3">from ${product.startingPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Color Selector */}
            {colors.length > 1 && (
              <div className="mb-6">
                <label className="text-sm font-bold text-white/70 mb-3 block">
                  Color: <span className="text-white">{selectedColor || 'Select a color'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => {
                    const hex = resolveColorHex(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                          isSelected ? 'border-blue-400 ring-2 ring-blue-400/30 scale-110' : 'border-white/20 hover:border-white/40'
                        }`}
                        title={color}
                      >
                        {hex ? (
                          <span
                            className="absolute inset-1 rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                        ) : (
                          <span className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-[8px] text-white font-bold">
                            {color.charAt(0)}
                          </span>
                        )}
                        {isSelected && (
                          <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow-lg z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 1 && (
              <div className="mb-6">
                <label className="text-sm font-bold text-white/70 mb-3 block">
                  Size: <span className="text-white">{selectedSize || 'Select a size'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400/30'
                            : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to Cart + Share */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || addedToCart}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-lg transition-all ${
                  addedToCart
                    ? 'bg-green-600 text-white'
                    : selectedVariant
                      ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {addedToCart ? (
                  <><Check size={20} /> Added to Cart</>
                ) : (
                  <><ShoppingBag size={20} /> {selectedVariant ? 'Add to Cart' : 'Select Options'}</>
                )}
              </button>
              <button
                onClick={handleShare}
                className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                title="Share this product"
              >
                <Share2 size={20} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <Truck size={20} className="text-blue-400 mb-1" />
                <span className="text-xs text-white/50">Free Shipping $50+</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <Shield size={20} className="text-green-400 mb-1" />
                <span className="text-xs text-white/50">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5 border border-white/5">
                <Package size={20} className="text-purple-400 mb-1" />
                <span className="text-xs text-white/50">Premium Quality</span>
              </div>
            </div>

            {/* Bundle Discount Info */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
              <p className="text-sm text-white/80">
                <span className="font-bold text-blue-400">Bundle & Save:</span> 10% off 2+ items, 15% off 5+ items
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/merch/${generateSlug(item.name)}`}
                  className="group glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-500"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ProductImage src={item.image} alt={item.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-blue-300 transition-colors truncate">{item.name}</h3>
                    <span className="text-sm font-black text-white">
                      {item.startingPrice ? `$${item.startingPrice.toFixed(2)}` : '---'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to All Merch */}
        <div className="mt-12 text-center">
          <Link href="/merch" className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full transition-all">
            <ArrowLeft size={18} />
            Back to All Merch
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Share This Product</h3>
              <button onClick={() => setShowShareModal(false)} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/merch/${slug}` : ''}
                className="flex-1 bg-transparent text-white/70 text-sm outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <p className="text-white/40 text-xs text-center">Send this link to anyone to share this product</p>
          </div>
        </div>
      )}
    </div>
  );
}
