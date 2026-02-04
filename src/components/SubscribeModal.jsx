/**
 * MYSTATION - Subscribe Modal
 * Shows after 3 free songs to collect email
 * Unlocks unlimited streaming
 */

'use client';

import { useState } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { X, Music, Sparkles, Heart, Mail, Check } from 'lucide-react';

export default function SubscribeModal() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { showSubscribeModal, closeSubscribeModal, pendingTrack, setTrack } = usePlayerStore();
  const { subscribe } = useUserStore();

  if (!showSubscribeModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);

    try {
      // Subscribe the user (stores in local state)
      subscribe(email);

      setSuccess(true);

      // After a moment, close and play the pending track
      setTimeout(() => {
        closeSubscribeModal();
        if (pendingTrack) {
          setTrack(pendingTrack);
        }
        setSuccess(false);
        setEmail('');
      }, 1500);

    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
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

        {/* Header with icon */}
        <div className="pt-10 pb-6 px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              {success ? (
                <Check size={40} className="text-white animate-bounce" />
              ) : (
                <Music size={40} className="text-white" />
              )}
            </div>

            {success ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
                <p className="text-white/60">Unlimited streaming unlocked</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Unlock Unlimited Music</h2>
                <p className="text-white/60">
                  You've played 3 free songs. Enter your email to keep streaming!
                </p>
              </>
            )}
          </div>
        </div>

        {!success && (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-6">
              <div className="relative mb-4">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={18} />
                    Unlock Free Streaming
                  </>
                )}
              </button>
            </form>

            {/* Benefits */}
            <div className="px-8 pb-8">
              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Check size={16} className="text-green-400 shrink-0" />
                  <span className="text-white/70">Unlimited streaming - all songs, anytime</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check size={16} className="text-green-400 shrink-0" />
                  <span className="text-white/70">Early access to new releases</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart size={16} className="text-pink-400 shrink-0" />
                  <span className="text-white/70">Support the Mike Page Foundation</span>
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
                    <p className="text-white/40 text-xs mb-0.5">Up next:</p>
                    <p className="text-white font-medium truncate">{pendingTrack.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skip option */}
            <div className="px-8 pb-8 text-center">
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
