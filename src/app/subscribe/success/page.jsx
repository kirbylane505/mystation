'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import {
  Heart, Music, Sparkles, Crown, CheckCircle, Gem,
  Globe, ShoppingBag, DollarSign, BarChart3, Users,
  Lock, Zap, ArrowRight, Headphones, Star, Radio
} from 'lucide-react';

const TIER_CONFIG = {
  diamond: {
    name: 'Diamond',
    icon: Gem,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-amber-500/5',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    headline: 'Welcome to the Diamond Club',
    subtitle: 'You now have the keys to your own empire.',
    features: [
      { icon: Globe, text: 'Your own station — your name, your page' },
      { icon: ShoppingBag, text: 'Upload & sell anything — keep 100%' },
      { icon: BarChart3, text: 'Full analytics dashboard' },
      { icon: Users, text: 'Own your audience — no algorithm' },
      { icon: Lock, text: 'Full Vault + Grammy Nights access' },
      { icon: Gem, text: 'Diamond badge everywhere' },
      { icon: ShoppingBag, text: '10% off all MyStation merch' },
      { icon: Radio, text: 'Unlimited streaming + Spotify Search' },
    ],
  },
  premium: {
    name: 'Premium',
    icon: Star,
    color: 'purple',
    gradient: 'from-purple-500 to-indigo-500',
    bgGradient: 'from-purple-500/20 via-indigo-500/10 to-purple-500/5',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    headline: 'Welcome to Premium',
    subtitle: 'You just unlocked the full MyStation experience.',
    features: [
      { icon: Zap, text: 'Global Spotify Search — 100M+ songs' },
      { icon: Music, text: 'Early access to new drops' },
      { icon: Users, text: 'Full Fan Zone access' },
      { icon: Radio, text: 'DJ Turntables unlocked' },
      { icon: Headphones, text: 'Unlimited streaming + background play' },
    ],
  },
  regular: {
    name: 'Supporter',
    icon: Headphones,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/20 via-blue-600/10 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    headline: 'Welcome to the Family',
    subtitle: 'Thank you for supporting independent music.',
    features: [
      { icon: Music, text: 'Unlimited streaming — no limits' },
      { icon: Headphones, text: 'Background playback & CarPlay' },
      { icon: Heart, text: 'Supporting youth music programs' },
    ],
  },
};

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const [tier, setTier] = useState(null);
  const [showContent, setShowContent] = useState(false);
  const { pendingTrack, setTrack, setIsPlaying } = usePlayerStore();
  const { subscribe } = useUserStore();

  useEffect(() => {
    const selectedTier = localStorage.getItem('mystation-selected-tier') || 'regular';
    setTier(selectedTier);

    // Set server-side subscription session cookie
    fetch('/api/subscription/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate', tier: selectedTier }),
    }).catch((err) => console.error('Session cookie failed:', err));

    // Mark user as subscribed in client store
    subscribe('subscriber@mystation.com', selectedTier);
    localStorage.removeItem('mystation-selected-tier');

    // Animate in after brief pause
    setTimeout(() => setShowContent(true), 300);

    // Auto-redirect for Supporter/Premium (not Diamond — they choose)
    if (selectedTier !== 'diamond') {
      const timer = setTimeout(() => {
        const savedPendingTrack = localStorage.getItem('mystation-pending-track');
        if (savedPendingTrack) {
          try {
            const track = JSON.parse(savedPendingTrack);
            setTrack(track);
            setIsPlaying(true);
          } catch {}
          localStorage.removeItem('mystation-pending-track');
        }
        router.push('/');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!tier) return null;

  const config = TIER_CONFIG[tier] || TIER_CONFIG.regular;
  const TierIcon = config.icon;
  const isDiamond = tier === 'diamond';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={`max-w-lg w-full text-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Tier Icon */}
        <div className="relative mb-8">
          <div className={`w-28 h-28 mx-auto bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center shadow-lg ${isDiamond ? 'shadow-amber-500/30' : ''}`}>
            <TierIcon size={56} className="text-white" />
          </div>
          {isDiamond && (
            <>
              <Sparkles className="absolute top-0 right-1/4 text-amber-400 animate-bounce" size={24} />
              <Sparkles className="absolute top-6 right-1/6 text-yellow-300 animate-bounce delay-150" size={18} />
              <Sparkles className="absolute bottom-4 left-1/4 text-amber-300 animate-bounce delay-300" size={20} />
            </>
          )}
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-black text-white mb-3">
          {config.headline.split(' ').map((word, i) => {
            const lastWord = config.headline.split(' ').pop();
            return word === lastWord ? (
              <span key={i} className={config.textColor}>{word} </span>
            ) : (
              <span key={i}>{word} </span>
            );
          })}
        </h1>

        <p className="text-white/60 text-lg mb-8">{config.subtitle}</p>

        {/* Features */}
        <div className={`bg-gradient-to-b ${config.bgGradient} rounded-2xl p-6 mb-8 border ${config.borderColor}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${config.textColor} mb-4`}>
            {isDiamond ? 'Your Diamond Powers' : `Your ${config.name} Benefits`}
          </h3>
          <div className="space-y-3 text-left">
            {config.features.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center shrink-0`}>
                    <FeatureIcon size={16} className="text-white" />
                  </div>
                  <span className="text-white/80 text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diamond CTA — Create Your Station */}
        {isDiamond && (
          <div className="space-y-3 mb-6">
            <Link
              href="/station/create"
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black rounded-xl hover:opacity-90 transition flex items-center justify-center gap-3 text-lg shadow-lg shadow-amber-500/30"
            >
              <Crown size={22} />
              Create Your Station
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/"
              className="w-full py-3 bg-white/5 border border-white/10 text-white/70 font-semibold rounded-xl hover:bg-white/10 transition flex items-center justify-center gap-2 text-sm"
            >
              Explore MyStation First
            </Link>
          </div>
        )}

        {/* Supporter/Premium — Loading redirect */}
        {!isDiamond && (
          <div className="flex items-center justify-center gap-3 text-white/60 mb-6">
            <div className={`w-6 h-6 border-2 ${config.borderColor} border-t-transparent rounded-full animate-spin`} />
            <span>Loading your music...</span>
          </div>
        )}

        {/* Foundation note */}
        <p className="text-white/30 text-xs">
          Every subscription supports the Mike Page Foundation 501(c)(3)
        </p>
      </div>
    </div>
  );
}
