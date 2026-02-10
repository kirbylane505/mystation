/**
 * MYSTATION - Email Capture Popup
 * Shows after 30s on first visit. "Get 10% off your first order"
 * Stores email to Supabase + gives discount code WELCOME10
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Gift, CheckCircle, Loader2, Sparkles } from 'lucide-react';

const DISCOUNT_CODE = 'WELCOME10';
const POPUP_DELAY = 30000; // 30 seconds
const STORAGE_KEY = 'mystation_email_captured';

export default function EmailCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Already subscribed — never show again
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Already dismissed — never show again
    if (localStorage.getItem(STORAGE_KEY + '_dismissed')) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, POPUP_DELAY);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    try {
      // Store email via API
      await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'popup' }),
      });

      localStorage.setItem(STORAGE_KEY, email);
      setStatus('success');
    } catch {
      // Still show success even if API fails — store locally
      localStorage.setItem(STORAGE_KEY, email);
      setStatus('success');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(DISCOUNT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setShow(false);
    // Dismissed = never show again
    localStorage.setItem(STORAGE_KEY + '_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={handleClose}>
      <div
        className="relative w-full max-w-md bg-gradient-to-b from-mystation-navy to-mystation-navyDark rounded-3xl border border-white/10 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition z-10">
          <X size={18} />
        </button>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-500/20 rounded-full blur-3xl" />

        {status === 'success' ? (
          <div className="relative pt-10 pb-8 px-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">You're In!</h2>
            <p className="text-white/60 text-sm mb-6">Here's your 10% off discount code:</p>

            <div
              onClick={handleCopy}
              className="mx-auto inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-dashed border-green-500/50 rounded-xl cursor-pointer hover:border-green-400 transition"
            >
              <Gift size={20} className="text-green-400" />
              <span className="text-2xl font-black text-green-400 tracking-widest">{DISCOUNT_CODE}</span>
            </div>
            <p className="text-white/40 text-xs mt-3">{copied ? 'Copied!' : 'Tap to copy'}</p>

            <p className="text-white/50 text-sm mt-6">Use at checkout on any merch purchase.</p>
            <button onClick={handleClose} className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition">
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="relative pt-10 pb-4 px-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Gift size={32} className="text-white" />
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full mb-3">
                <Sparkles size={12} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold">EXCLUSIVE OFFER</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Get 10% Off</h2>
              <p className="text-white/60 text-sm">
                Join the MyStation fam and get 10% off your first merch order. Plus new drops, exclusive deals, and festival updates.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-6 space-y-3">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500 transition text-lg"
                  required
                  disabled={status === 'loading'}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 text-lg"
              >
                {status === 'loading' ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Gift size={18} />
                    Get My 10% Off
                  </>
                )}
              </button>
            </form>

            <div className="px-8 pb-8 text-center">
              <p className="text-white/30 text-xs">No spam. Unsubscribe anytime.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
