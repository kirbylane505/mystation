/**
 * MYSTATION - Subscribe Modal
 * 24-hour free trial → hard paywall after expiry
 * "Add Card Now" or "Later" during trial
 * After 24hrs: MUST subscribe — no skip, no close
 */

'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore, useUserStore } from '@/store/playerStore';
import { X, Music, Sparkles, Heart, Check, CreditCard, Zap, Crown, ShoppingBag, Clock } from 'lucide-react';
import Link from 'next/link';

export default function SubscribeModal() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const { showSubscribeModal, closeSubscribeModal, pendingTrack, setTrack, getTrialRemaining } = usePlayerStore();
  const { subscribe, isSubscribed } = useUserStore();

  // Check if trial is expired (hard wall mode)
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (showSubscribeModal) {
      const remaining = getTrialRemaining();
      setTrialExpired(remaining <= 0);
    }
  }, [showSubscribeModal, getTrialRemaining]);

  if (!showSubscribeModal) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (pendingTrack) {
        localStorage.setItem('mystation-pending-track', JSON.stringify(pendingTrack));
      }
      window.location.href = 'https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04';
    } catch (err) {
      console.error('Subscription error:', err);
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

  const handleLater = () => {
    // Only allow dismissing during trial period
    if (!trialExpired) {
      closeSubscribeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — only during trial */}
        {!trialExpired && (
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10"
          >
            <X size={18} />
          </button>
        )}

        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              {success ? (
                <Check size={40} className="text-white animate-bounce" />
              ) : trialExpired ? (
                <Crown size={40} className="text-white" />
              ) : (
                <Clock size={40} className="text-white" />
              )}
            </div>

            {success ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to the Family!</h2>
                <p className="text-white/60">Unlimited streaming unlocked</p>
              </>
            ) : trialExpired ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">We'd Love to Have You Join the MyStation Family</h2>
                <p className="text-white/60">
                  Your 24-hour free trial has ended. Subscribe to continue streaming, access new releases, and support the music!
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">You're in Your Free Trial!</h2>
                <p className="text-white/60">
                  Add your card now to lock in unlimited streaming, or keep listening free for the rest of your trial.
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
                {trialExpired && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    TRIAL ENDED
                  </div>
                )}
                {!trialExpired && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    BEST VALUE
                  </div>
                )}

                <div className="mb-4">
                  <span className="text-5xl font-black text-white">$4.99</span>
                  <span className="text-white/60 text-lg">/month</span>
                </div>

                <p className="text-white/70 text-sm mb-4">
                  Cancel anytime. Your support helps build youth and community programs worldwide.
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
                      Add Card Now
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

            {/* Merch CTA — always available */}
            <div className="px-8 pb-4">
              <Link
                href="/merch"
                onClick={() => closeSubscribeModal()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-300 font-semibold rounded-xl hover:bg-orange-500/30 transition text-sm"
              >
                <ShoppingBag size={16} />
                Shop Official Merch
              </Link>
            </div>

            {/* Access Code */}
            <div className="px-8 pb-4">
              {!showCodeInput ? (
                <button
                  onClick={() => setShowCodeInput(true)}
                  className="w-full text-center text-blue-400/70 text-sm hover:text-blue-400 transition"
                >
                  Have an access code?
                </button>
              ) : (
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <p className="text-white/60 text-xs mb-3 text-center">Enter your access code for free unlimited streaming</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => { setAccessCode(e.target.value); setCodeError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleAccessCode()}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500 uppercase tracking-wider"
                      autoFocus
                    />
                    <button
                      onClick={handleAccessCode}
                      disabled={codeLoading || !accessCode.trim()}
                      className="px-5 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition disabled:opacity-50 text-sm"
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

            {/* Later option — ONLY during trial. After 24hrs: hard wall, no skip */}
            {!trialExpired ? (
              <div className="px-8 pb-8 flex flex-col items-center">
                <button
                  onClick={handleLater}
                  className="text-white/60 text-sm hover:text-white/80 transition py-2 px-4"
                >
                  Later
                </button>
              </div>
            ) : (
              <div className="px-8 pb-8 text-center">
                <p className="text-white/30 text-xs">
                  Subscribe to continue using MyStation
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
