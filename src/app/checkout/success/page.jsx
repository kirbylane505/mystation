/**
 * MYSTATION - Checkout Success Page
 * Celebration + LOTL 50% off coupon for orders $26+
 */

'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { CheckCircle, ShoppingBag, Music, Package, Loader2, Ticket, Gift, PartyPopper } from 'lucide-react';
import Link from 'next/link';

// Firework celebration component
function Fireworks() {
  useEffect(() => {
    // Dynamic import confetti
    import('canvas-confetti').then((confetti) => {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

      (function frame() {
        confetti.default({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti.default({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Big burst in the middle
      setTimeout(() => {
        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors
        });
      }, 500);
    }).catch(() => {
      // Confetti not available, that's ok
    });
  }, []);

  return null;
}

// LOTL Coupon component
function LOTLCoupon({ orderTotal }) {
  const couponCode = 'LOTL50OFF';
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (orderTotal < 26) return null;

  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-purple-500/30 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <PartyPopper className="text-yellow-400" size={24} />
        <h3 className="text-lg font-bold text-white">🎉 SPECIAL REWARD!</h3>
      </div>
      <p className="text-white/80 text-sm mb-4">
        Your order qualifies for <strong className="text-green-400">50% OFF</strong> a
        <strong className="text-purple-400"> Love on the Lawn 2026 Festival</strong> ticket!
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-black/30 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs">Your Coupon Code</p>
            <p className="text-2xl font-bold text-white tracking-wider">{couponCode}</p>
          </div>
          <Ticket className="text-purple-400" size={32} />
        </div>
        <button
          onClick={copyCode}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-bold transition"
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-white/50 text-xs mt-3">
        Use this code when purchasing your LOTL ticket at checkout. Valid for one use.
      </p>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const isDemo = searchParams.get('demo') === 'true';
  const orderTotal = parseFloat(searchParams.get('total') || '30'); // Default to qualifying amount

  // Clear cart on success
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Fireworks */}
      <Fireworks />

      <div className="max-w-lg w-full text-center relative z-10">
        {/* Animated checkmark */}
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle size={48} className="text-green-400" />
        </div>

        {/* Thank you message with animation */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 animate-pulse">
            🎉 THANK YOU! 🎉
          </h1>
          <p className="text-xl text-white/80">
            For Your Purchase!
          </p>
        </div>

        <p className="text-white/60 text-sm sm:text-base mb-2">
          Your order has been confirmed and is being processed.
        </p>

        {(sessionId || orderId) && (
          <p className="text-white/40 text-xs sm:text-sm mb-6">
            Order Reference:{' '}
            <span className="text-blue-400 font-mono">
              {orderId || sessionId?.slice(-8)}
            </span>
          </p>
        )}

        {isDemo && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 text-sm">
              🎭 Demo Mode - No actual payment was processed.
            </p>
          </div>
        )}

        {/* LOTL Coupon for orders $26+ */}
        <LOTLCoupon orderTotal={orderTotal} />

        <div className="glass rounded-2xl p-6 mb-6 text-left">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Package size={20} className="text-blue-400" />
            What's Next?
          </h2>
          <ul className="space-y-3 text-white/70 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
                1
              </span>
              <span>You'll receive an email confirmation shortly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
                2
              </span>
              <span>Your order will be printed and shipped within 3-5 business days</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-blue-400 text-xs font-bold">
                3
              </span>
              <span>Tracking info will be sent once your order ships</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/merch"
            className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            Continue Shopping
          </Link>
          <Link
            href="/music"
            className="btn-secondary py-3 px-6 flex items-center justify-center gap-2"
          >
            <Music size={18} />
            Listen to Music
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="text-blue-400 animate-spin" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
