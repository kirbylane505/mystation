/**
 * MYSTATION - Subscribe Modal
 * Appears after 3 free plays - pushes signup
 * Clean, premium design that converts
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Music, Heart, Headphones, Sparkles, Check, Crown, Gift, Zap } from 'lucide-react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';

export default function SubscribeModal() {
  const { showSubscribeModal, closeSubscribeModal, returnToLastPlayed, lastPlayedTrack } = usePlayerStore();
  const { subscribe, isSubscribed } = useUserStore();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (showSubscribeModal) {
      setSuccess(false);
      setError('');
      setEmail('');
    }
  }, [showSubscribeModal]);

  // Close modal if already subscribed
  useEffect(() => {
    if (isSubscribed && showSubscribeModal) {
      closeSubscribeModal();
    }
  }, [isSubscribed, showSubscribeModal, closeSubscribeModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Subscribe the user
    subscribe(email);
    setSuccess(true);
    setIsSubmitting(false);

    // Close modal after success animation
    setTimeout(() => {
      closeSubscribeModal();
    }, 1500);
  };

  const handleClose = () => {
    returnToLastPlayed();
  };

  if (!showSubscribeModal) return null;

  const benefits = [
    { icon: Headphones, text: 'Unlimited music streaming' },
    { icon: Crown, text: 'Early access to new releases' },
    { icon: Heart, text: 'Save favorites & playlists' },
    { icon: Gift, text: 'Exclusive content & behind the scenes' },
    { icon: Zap, text: 'HD audio quality' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 animate-fade-in">
        <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-10 text-center overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute w-64 h-64 bg-white/20 rounded-full blur-3xl -top-32 -left-32 animate-pulse" />
              <div className="absolute w-48 h-48 bg-white/20 rounded-full blur-3xl -bottom-24 -right-24 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <Music size={40} className="text-white" />
            </div>

            <h2 className="relative text-3xl font-bold text-white mb-2">
              You're Loving It!
            </h2>
            <p className="relative text-white/80 text-lg">
              Subscribe free to keep the music playing
            </p>

            {/* Floating badges */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <span className="px-4 py-1.5 bg-white text-blue-600 text-sm font-bold rounded-full shadow-lg">
                100% FREE
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Last played track reminder */}
            {lastPlayedTrack && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Music size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs">Now playing</p>
                  <p className="text-white font-medium truncate">{lastPlayedTrack.title}</p>
                </div>
              </div>
            )}

            {success ? (
              /* Success state */
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check size={40} className="text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Welcome to MyStation!</h3>
                <p className="text-white/60">Enjoy unlimited music.</p>
              </div>
            ) : (
              <>
                {/* Benefits list */}
                <div className="space-y-3 mb-8">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon size={16} className="text-blue-400" />
                      </div>
                      <span className="text-white/80 text-sm">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-5 py-4 bg-white/5 border border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                      autoFocus
                    />
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Subscribe Free
                      </>
                    )}
                  </button>
                </form>

                {/* Foundation note */}
                <p className="text-center text-white/40 text-xs mt-6">
                  MyStation is a Mike Page Foundation initiative.
                  <br />
                  All donations support youth music programs.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Go back option */}
        {!success && (
          <button
            onClick={handleClose}
            className="w-full mt-4 py-3 text-white/50 hover:text-white/70 text-sm transition"
          >
            Go back to last song
          </button>
        )}
      </div>
    </div>
  );
}
