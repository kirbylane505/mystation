/**
 * MYSTATION - Checkout Success Page
 * Celebration + LOTL 50% off coupon for orders $26+
 */

'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/playerStore';
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

// Free LOTL Ticket Callout — every merch order qualifies
function FreeLotlTicketCallout() {
  const claimEmail = 'contact@lotlfest.com';
  const subject = encodeURIComponent('FREE LOTL TICKET - Pic of me in my MyStation merch');
  const body = encodeURIComponent(
    'Hey LOTL crew,\n\nAttached is a pic of me wearing my MyStation merch. Send my free LOTL Day 2026 ticket to this email.\n\nThanks.\n'
  );
  const mailto = `mailto:${claimEmail}?subject=${subject}&body=${body}`;

  return (
    <div className="mb-6 p-5 bg-gradient-to-r from-yellow-500/15 via-amber-500/15 to-yellow-500/15 border-2 border-yellow-400/50 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="text-yellow-400" size={26} />
        <h3 className="text-lg font-bold text-white">FREE LOTL DAY TICKET INSIDE THIS ORDER</h3>
      </div>
      <p className="text-white/85 text-sm mb-4 leading-relaxed">
        Send a pic of you wearing your gear to{' '}
        <strong className="text-yellow-300">{claimEmail}</strong> and we email back your{' '}
        <strong className="text-yellow-300">FREE ticket</strong> to Love on the Lawn Day, September 5, 2026 at Festival Park, Elgin IL.
      </p>
      <p className="text-white/70 text-xs mb-4">
        Receipt arrives within minutes. Ticket arrives once we get your pic. Tag <strong>@lotlfest</strong> on social for bonus love.
      </p>
      <a
        href={mailto}
        className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-3 rounded-xl font-bold transition"
      >
        <Gift size={18} />
        Send Your Pic to Claim
      </a>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCartStore();
  const { subscribe, setEmail: setStoreEmail } = useUserStore();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const isDemo = searchParams.get('demo') === 'true';
  const autoSub = searchParams.get('auto_sub') === '1';
  const customerEmail = searchParams.get('email') || '';
  const orderTotal = parseFloat(searchParams.get('total') || '30'); // Default to qualifying amount

  // Clear cart + activate subscription cookie on success
  useEffect(() => {
    clearCart();

    // Activate subscription cookie (purchase grants 1 month free access)
    if (autoSub || !isDemo) {
      fetch('/api/subscription/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate', sessionId }),
      }).then(() => {
        if (customerEmail) {
          subscribe(customerEmail.toLowerCase().trim());
        }
      }).catch(() => {});
    }

    // Store email if available
    if (customerEmail) {
      const clean = customerEmail.toLowerCase().trim();
      localStorage.setItem('mystation_email', clean);
      setStoreEmail(clean);
    }
  }, [clearCart, autoSub, isDemo, customerEmail, subscribe, setStoreEmail]);

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

        {/* FREE LOTL Day ticket — every merch order qualifies */}
        <FreeLotlTicketCallout />

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
