/**
 * MYSTATION - Subscribe Modal
 * Shows after 3 free songs - $4.99/month subscription
 * Unlocks unlimited streaming
 */

'use client';

import { useState } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { X, Music, Sparkles, Heart, Check, CreditCard, Zap, Crown } from 'lucide-react';

export default function SubscribeModal() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { showSubscribeModal, closeSubscribeModal, pendingTrack, setTrack, playCount } = usePlayerStore();
  const { subscribe, isSubscribed } = useUserStore();

  if (!showSubscribeModal) return null;

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // TODO: Integrate Stripe checkout for $4.99/month
      // For now, redirect to Stripe payment link
      window.open('https://buy.stripe.com/test_mystationsubscribe', '_blank');

      // After payment completes, user will be subscribed
      // For demo, we'll simulate success after redirect
      setLoading(false);
    } catch (err) {
      console.error('Subscription error:', err);
      setLoading(false);
    }
  };

  // Demo subscribe (remove in production)
  const handleDemoSubscribe = () => {
    subscribe('subscriber@mystation.com');
    setSuccess(true);

    setTimeout(() => {
      closeSubscribeModal();
      if (pendingTrack) {
        setTrack(pendingTrack);
      }
      setSuccess(false);
    }, 1500);
  };

  const handleSkip = () => {
    closeSubscribeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              {success ? (
                <Check size={40} className="text-white animate-bounce" />
              ) : (
                <Crown size={40} className="text-white" />
              )}
            </div>

            {success ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to MyStation!</h2>
                <p className="text-white/60">Unlimited streaming unlocked</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">You're Loving It!</h2>
                <p className="text-white/60">
                  You've played {playCount} free songs. Subscribe to keep the music going!
                </p>
              </>
            )}
          </div>
        </div>

        {!success && (
          <>
            {/* Pricing Card */}
            <div className="px-8 pb-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30 p-6 text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  BEST VALUE
                </div>

                <div className="mb-4">
                  <span className="text-5xl font-black text-white">$4.99</span>
                  <span className="text-white/60 text-lg">/month</span>
                </div>

                <p className="text-white/70 text-sm mb-4">
                  Cancel anytime. 100% goes to the Mike Page Foundation.
                </p>

                <button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Subscribe Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="px-8 pb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Zap size={16} className="text-blue-400" />
                  </div>
                  <span className="text-white/80">Unlimited streaming - all 30+ songs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-purple-400" />
                  </div>
                  <span className="text-white/80">Early access to new releases</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Heart size={16} className="text-pink-400" />
                  </div>
                  <span className="text-white/80">Support youth music programs</span>
                </div>
              </div>
            </div>

            {/* Pending track preview */}
            {pendingTrack && (
              <div className="px-8 pb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Music size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-xs mb-0.5">Ready to play:</p>
                    <p className="text-white font-medium truncate">{pendingTrack.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skip / Demo options */}
            <div className="px-8 pb-8 flex flex-col items-center gap-3">
              <button
                onClick={handleDemoSubscribe}
                className="text-blue-400 text-sm hover:text-blue-300 transition underline"
              >
                Demo: Unlock Free (dev only)
              </button>
              <button
                onClick={handleSkip}
                className="text-white/40 text-sm hover:text-white/60 transition"
              >
                Maybe later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
