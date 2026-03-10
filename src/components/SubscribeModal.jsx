/**
 * MYSTATION - Subscribe Modal (3-Tier System)
 * Regular $4.99 | Premium $9.99 | Diamond $14.99
 * 24-hour free trial → hard paywall after expiry
 */

'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { X, Music, Check, CreditCard, Crown, ShoppingBag, Gem, Star, Headphones } from 'lucide-react';
import Link from 'next/link';
import { isNative } from '@/lib/native';

// Stripe checkout links per tier — MyStation LLC (acct_1T1jP1R0BloCNd9r)
// Hidden on iOS native app (Apple IAP rules)
const STRIPE_LINKS = {
  regular: 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00',
  premium: 'https://buy.stripe.com/bJe00lcmL2t8cuUcv11oI01',
  diamond: 'https://buy.stripe.com/6oUbJ3euT5FkdyYgLh1oI02',
};

export default function SubscribeModal() {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('premium'); // default highlight
  const [success, setSuccess] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const { showSubscribeModal, closeSubscribeModal, pendingTrack, setTrack } = usePlayerStore();
  const { subscribe, isSubscribed } = useUserStore();

  // NEVER show subscribe modal to subscribers — they're already in
  if (!showSubscribeModal) return null;
  if (isSubscribed) {
    // Subscriber somehow triggered the modal — auto-close and play the track
    if (pendingTrack) {
      setTimeout(() => { setTrack(pendingTrack); closeSubscribeModal(); }, 0);
    } else {
      setTimeout(() => closeSubscribeModal(), 0);
    }
    return null;
  }
  // Also check cookie directly (belt-and-suspenders — cookie is source of truth)
  if (typeof document !== 'undefined' && (
    document.cookie.includes('mystation-sub-flag=') ||
    document.cookie.includes('mystation-sub=') ||
    document.cookie.includes('mystation-friend=')
  )) {
    if (pendingTrack) {
      setTimeout(() => { setTrack(pendingTrack); closeSubscribeModal(); }, 0);
    } else {
      setTimeout(() => closeSubscribeModal(), 0);
    }
    return null;
  }

  const handleSubscribe = async (tier) => {
    setLoading(true);
    try {
      if (pendingTrack) {
        localStorage.setItem('mystation-pending-track', JSON.stringify(pendingTrack));
      }
      localStorage.setItem('mystation-selected-tier', tier);
      window.location.href = STRIPE_LINKS[tier];
    } catch (err) {
      setLoading(false);
    }
  };

  const handleAccessCode = async () => {
    if (!accessCode.trim()) return;
    setCodeLoading(true);
    setCodeError('');

    try {
      const res = await fetch('/api/access-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        subscribe('friend@mystation.com');
        setSuccess(true);
        setTimeout(() => {
          closeSubscribeModal();
          if (pendingTrack) {
            setTrack(pendingTrack);
          }
          setSuccess(false);
        }, 1500);
      } else {
        setCodeError('Invalid code. Try again.');
      }
    } catch {
      setCodeError('Something went wrong. Try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  // Close modal — they can browse but nothing works without subscribing

  const tiers = [
    {
      id: 'regular',
      name: 'Regular',
      price: '4.99',
      icon: <Headphones size={22} className="text-blue-400" />,
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      btnGradient: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-500/20',
      features: [
        'Unlimited streaming',
        'Background playback',
        'Support the Foundation',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '9.99',
      icon: <Star size={22} className="text-purple-400" />,
      color: 'purple',
      gradient: 'from-purple-500/20 to-indigo-600/10',
      border: 'border-purple-500/40',
      btnGradient: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/30',
      popular: true,
      features: [
        'Everything in Regular',
        'Global Spotify Search (100M+ songs)',
        'Early access to new drops',
        'Full Fan Zone access',
        'DJ Turntables unlocked',
      ],
    },
    {
      id: 'diamond',
      name: 'Diamond',
      price: '14.99',
      icon: <Gem size={22} className="text-amber-400" />,
      color: 'amber',
      gradient: 'from-amber-500/20 to-yellow-600/10',
      border: 'border-amber-500/40',
      btnGradient: 'from-amber-500 to-yellow-500',
      shadow: 'shadow-amber-500/30',
      features: [
        'Everything in Premium',
        'Add songs to catalog',
        '10% off all merch',
        'Full Vault access',
        'Grammy Nights access',
        'Diamond badge everywhere',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — let them browse, but nothing works without subscribing */}
        <button
          onClick={closeSubscribeModal}
          className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="pt-8 pb-4 px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              {success ? (
                <Check size={36} className="text-white animate-bounce" />
              ) : (
                <Crown size={36} className="text-white" />
              )}
            </div>

            {success ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">Welcome to the Family!</h2>
                <p className="text-white/60 text-sm">Unlimited streaming unlocked</p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-1">Subscribe to Unlock Full Tracks</h2>
                <div className="space-y-1 mt-2">
                  <p className="text-white/70 text-sm flex items-center justify-center gap-1.5">
                    <Check size={14} className="text-green-400 shrink-0" /> Preview any song — subscribe for full streaming
                  </p>
                  <p className="text-[#D4AF37] text-sm font-semibold flex items-center justify-center gap-1.5">
                    <span className="text-base">🎫</span> Stay through August = FREE LOTL ticket ($20 value)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {!success && (
          <>
            {/* 3-Tier Pricing Cards */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {tiers.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`relative text-left rounded-2xl p-4 border-2 transition-all duration-200 ${
                        isSelected
                          ? `bg-gradient-to-b ${tier.gradient} ${tier.border} scale-[1.02]`
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                          Most Popular
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? `bg-${tier.color}-500/20` : 'bg-white/10'}`}>
                          {tier.icon}
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white/70'}`}>{tier.name}</span>
                      </div>

                      <div className="mb-3">
                        <span className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-white/60'}`}>${tier.price}</span>
                        <span className="text-white/40 text-sm">/mo</span>
                      </div>

                      <ul className="space-y-1.5">
                        {tier.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <Check size={12} className={`mt-0.5 shrink-0 ${isSelected ? `text-${tier.color}-400` : 'text-white/30'}`} />
                            <span className={isSelected ? 'text-white/90' : 'text-white/50'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subscribe Button */}
            <div className="px-6 pb-4">
              {isNative ? (
                <>
                  <a
                    href="https://mystationlive.com/subscribe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-4 bg-gradient-to-r ${tiers.find(t => t.id === selectedTier)?.btnGradient} text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg ${tiers.find(t => t.id === selectedTier)?.shadow}`}
                  >
                    Subscribe at mystationlive.com
                  </a>
                  <p className="text-white/30 text-xs text-center mt-2">Subscribe on our website to unlock full streaming. All proceeds support youth & community programs.</p>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSubscribe(selectedTier)}
                    disabled={loading}
                    className={`w-full py-4 bg-gradient-to-r ${tiers.find(t => t.id === selectedTier)?.btnGradient} text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${tiers.find(t => t.id === selectedTier)?.shadow}`}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Start Free Trial — ${tiers.find(t => t.id === selectedTier)?.price}/mo after
                      </>
                    )}
                  </button>
                  <p className="text-white/30 text-xs text-center mt-2">First month FREE. Cancel anytime. All proceeds support youth & community programs.</p>
                </>
              )}
            </div>

            {/* Pending track preview */}
            {pendingTrack && (
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Music size={18} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-[10px] mb-0.5">Ready to play:</p>
                    <p className="text-white font-medium text-sm truncate">{pendingTrack.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Merch CTA */}
            <div className="px-6 pb-3">
              <Link
                href="/merch"
                onClick={() => closeSubscribeModal()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-300 font-semibold rounded-xl hover:bg-orange-500/30 transition text-sm"
              >
                <ShoppingBag size={15} />
                Shop Official Merch
              </Link>
            </div>

            {/* Access Code — hidden on iOS native (Apple IAP rules) */}
            {!isNative && (
              <div className="px-6 pb-3">
                {!showCodeInput ? (
                  <button
                    onClick={() => setShowCodeInput(true)}
                    className="w-full text-center text-blue-400/70 text-xs hover:text-blue-400 transition"
                  >
                    Have an access code?
                  </button>
                ) : (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-3">
                    <p className="text-white/60 text-xs mb-2 text-center">Enter your access code for free unlimited streaming</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => { setAccessCode(e.target.value); setCodeError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleAccessCode()}
                        placeholder="Enter code"
                        className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500 uppercase tracking-wider"
                        autoFocus
                      />
                      <button
                        onClick={handleAccessCode}
                        disabled={codeLoading || !accessCode.trim()}
                        className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition disabled:opacity-50 text-sm"
                      >
                        {codeLoading ? '...' : 'Go'}
                      </button>
                    </div>
                    {codeError && (
                      <p className="text-red-400 text-xs mt-2 text-center">{codeError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="px-6 pb-6 flex flex-col items-center gap-2">
              <Link
                href="/account"
                onClick={() => closeSubscribeModal()}
                className="text-blue-400 text-sm font-medium hover:text-blue-300 transition py-1 px-4"
              >
                Already a member? Sign In
              </Link>
              <button
                onClick={closeSubscribeModal}
                className="text-white/40 text-xs hover:text-white/60 transition py-1 px-4"
              >
                Just browsing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
