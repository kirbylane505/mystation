'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { Heart, Music, Sparkles, Crown, CheckCircle } from 'lucide-react';

export default function SubscribeSuccessPage() {
  const router = useRouter();
  const [showMessage, setShowMessage] = useState(true);
  const { pendingTrack, setTrack, setIsPlaying } = usePlayerStore();
  const { subscribe } = useUserStore();

  useEffect(() => {
    // Set server-side subscription session cookie (httpOnly, HMAC-signed)
    fetch('/api/subscription/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate' }),
    }).catch(() => {});

    // Mark user as subscribed in client store
    subscribe('subscriber@mystation.com');

    // Get the pending track from localStorage (saved before Stripe redirect)
    const savedPendingTrack = localStorage.getItem('mystation-pending-track');

    // Auto-play after 3 seconds
    const timer = setTimeout(() => {
      if (savedPendingTrack) {
        try {
          const track = JSON.parse(savedPendingTrack);
          setTrack(track);
          setIsPlaying(true);
        } catch {}
        localStorage.removeItem('mystation-pending-track');
      }

      // Redirect to home after showing message
      router.push('/');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle size={64} className="text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-full h-full">
            <Sparkles className="absolute top-0 right-8 text-yellow-400 animate-bounce" size={24} />
            <Sparkles className="absolute top-8 right-0 text-yellow-400 animate-bounce delay-100" size={20} />
            <Sparkles className="absolute bottom-8 left-0 text-yellow-400 animate-bounce delay-200" size={20} />
          </div>
        </div>

        {/* Thank You Message */}
        <h1 className="text-4xl font-black text-white mb-4">
          Welcome to the <span className="text-blue-400">Family!</span>
        </h1>

        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="text-red-400" fill="currentColor" size={24} />
            <Crown className="text-yellow-400" size={24} />
            <Heart className="text-red-400" fill="currentColor" size={24} />
          </div>
          <p className="text-xl text-white font-semibold mb-2">
            Thank you for subscribing!
          </p>
          <p className="text-white/70">
            It means the world to the <span className="text-blue-400 font-bold">MyStation Family</span>.
            Your support helps youth music programs through the Mike Page Foundation.
          </p>
        </div>

        {/* What they get */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span>Unlimited streaming - no limits</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span>Access to exclusive tracks</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle size={16} className="text-green-400" />
            </div>
            <span>Supporting youth music programs</span>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3 text-white/60">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading your music...</span>
        </div>
      </div>
    </div>
  );
}
