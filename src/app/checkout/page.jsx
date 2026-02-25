/**
 * MYSTATION - Checkout Page
 * Simplified checkout using Stripe Checkout
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import {
  ShoppingBag,
  CreditCard,
  Truck,
  Shield,
  ChevronLeft,
  Loader2,
  Trash2,
  Plus,
  Minus,
} from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getDiscountedTotal, removeItem, updateQuantity, clearCart, referralCode } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const discountedTotal = getDiscountedTotal();

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/merch');
    }
  }, [items, router]);

  // Handle Stripe Checkout
  const handleCheckout = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            name: item.name,
            variantName: item.variantName,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            provider: item.provider,
            printfulSyncVariantId: item.printfulSyncVariantId,
            printifyProductId: item.printifyProductId,
            printifyVariantId: item.printifyVariantId,
          })),
          email,
          discountCode: referralCode || localStorage.getItem('mystation_referral_discount') || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Demo mode - show success
      if (data.demo) {
        clearCart();
        router.push(`/checkout/success?order_id=${data.orderId}&demo=true`);
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 pb-44">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/merch"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition mb-3 sm:mb-4 text-sm sm:text-base bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
          >
            <ChevronLeft size={18} />
            Continue Shopping
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="glass rounded-2xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-blue-400" />
              Your Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl"
                >
                  {/* Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={24} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm sm:text-base truncate">
                      {item.name}
                    </p>
                    {item.variantName && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.variantName.split(/\s*[\/\-]\s*/).map((part, i) => (
                          <span key={i} className="inline-block px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded-md font-medium">
                            {part.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-blue-400 font-bold mt-1">
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, Math.max(1, item.quantity - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-white w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto text-red-400 hover:text-red-300 transition p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right">
                    <p className="text-white font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Checkout */}
          <div className="space-y-4 sm:space-y-6">
            {/* Email */}
            <div className="glass rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard size={20} className="text-blue-400" />
                Contact Info
              </h2>
              <div>
                <label className="block text-white/60 text-xs sm:text-sm mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder-white/30 focus:border-blue-500 focus:outline-none transition"
                />
                <p className="text-white/40 text-xs mt-2">
                  You'll enter shipping info on the next page
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="glass rounded-2xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-400" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount.percent > 0 && (
                  <div className="flex justify-between text-green-400 text-sm font-medium">
                    <span>{discount.label}</span>
                    <span>-${(subtotal - discountedTotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/60 text-sm">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/10">
                  <span>Total</span>
                  <span>${(discount.percent > 0 ? discountedTotal : subtotal).toFixed(2)}+</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full btn-primary py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Checkout with Stripe
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-white/40 text-xs">
                <span className="flex items-center gap-1">
                  <Shield size={14} /> Secure Payment
                </span>
                <span className="flex items-center gap-1">
                  <Truck size={14} /> Fast Shipping
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
