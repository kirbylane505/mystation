/**
 * MYSTATION - Cart Drawer Component
 * Slide-out shopping cart
 */

'use client';

import { useCartStore } from '@/stores/cartStore';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Cart() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getItemCount,
    getDiscount,
    getDiscountedTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const discount = getDiscount();
  const discountedTotal = getDiscountedTotal();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={closeCart}
      />

      {/* Cart Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-white/10 z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Your Cart</h2>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
              {itemCount} items
            </span>
          </div>
          <button
            onClick={closeCart}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={64} className="text-white/10 mb-4" />
              <p className="text-white/40 text-lg mb-2">Your cart is empty</p>
              <p className="text-white/20 text-sm mb-6">
                Add some merch to get started
              </p>
              <button
                onClick={closeCart}
                className="btn-secondary"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-4 bg-white/5 rounded-xl"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
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

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {item.name}
                    </h3>
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
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-white w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-gray-900/80 backdrop-blur">
            {/* Subtotal */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60">Subtotal</span>
              <span className={`font-bold text-white ${discount.percent > 0 ? 'text-lg line-through text-white/40' : 'text-2xl'}`}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            {/* Bundle Discount */}
            {discount.percent > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-400 font-medium text-sm">{discount.label}</span>
                <span className="text-green-400 font-bold">-${(subtotal - discountedTotal).toFixed(2)}</span>
              </div>
            )}

            {discount.percent > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">Total</span>
                <span className="text-2xl font-bold text-white">${discountedTotal.toFixed(2)}</span>
              </div>
            )}

            {/* Upsell nudge */}
            {itemCount === 1 && (
              <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-green-400 text-sm font-medium">Add 1 more item for 10% OFF your order!</p>
              </div>
            )}
            {itemCount >= 2 && itemCount < 5 && (
              <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-green-400 text-sm font-medium">Add {5 - itemCount} more for 15% OFF!</p>
              </div>
            )}

            <p className="text-white/40 text-sm mb-4">
              Shipping & taxes calculated at checkout
            </p>

            {/* Checkout Button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-lg"
            >
              <ShoppingBag size={20} />
              Checkout
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full mt-3 py-3 text-white/60 hover:text-white text-sm transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

// Cart Icon Button for Navbar
export function CartButton() {
  const { toggleCart, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 rounded-full hover:bg-white/10 transition"
    >
      <ShoppingBag size={24} className="text-white" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
