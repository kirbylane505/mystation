/**
 * MYSTATION - Email Gate
 * Full-screen mandatory email capture — no X, no dismiss, no bypass.
 * Enter email to access MyStation. Starts 24hr free trial.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Mail, Loader2, Music2, Headphones } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

// Routes that NEVER show the email gate
const FREE_ROUTES = [
  '/merch', '/checkout', '/lotl', '/about', '/contact',
  '/terms', '/privacy', '/subscribe',
];

function isFreePage(pathname) {
  if (pathname === '/') return true;
  return FREE_ROUTES.some(r => pathname.startsWith(r));
}

export default function EmailGate() {
  const pathname = usePathname();
  const { email: storedEmail, setEmail: setStoreEmail } = useUserStore();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Skip on free pages
    if (isFreePage(pathname)) {
      setShow(false);
      return;
    }

    // Check if user already has email
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('mystation_email') || storedEmail
      : storedEmail;

    if (saved) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [pathname, storedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // 1. Capture email for marketing
      await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), source: 'gate' }),
      });

      // 2. Start trial (creates Supabase row + sets httpOnly cookie)
      const res = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        throw new Error('Trial start failed');
      }

      // 3. Store in localStorage + zustand
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      localStorage.setItem('mystation_email_captured', cleanEmail);
      setStoreEmail(cleanEmail);
      setShow(false);
    } catch {
      // Still store locally even if API fails
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      localStorage.setItem('mystation_email_captured', cleanEmail);
      setStoreEmail(cleanEmail);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Headphones size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MyStation</h1>
          <p className="text-white/50 text-sm mt-1">by IDMG</p>
        </div>

        {/* Gate card */}
        <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full mb-3">
              <Music2 size={12} className="text-blue-400" />
              <span className="text-blue-400 text-xs font-bold">24-HOUR FREE PREVIEW</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Enter your email to start listening</h2>
            <p className="text-white/50 text-sm">
              Get full access to music, playlists, and more for 24 hours. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                placeholder="your@email.com"
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition text-lg"
                required
                autoFocus
                disabled={status === 'loading'}
              />
            </div>

            {status === 'error' && (
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-lg"
            >
              {status === 'loading' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Start Free Preview'
              )}
            </button>
          </form>

          <p className="text-white/30 text-xs text-center mt-4">
            No spam, ever. We just need your email to start your preview.
          </p>
        </div>

        {/* Free access note */}
        <p className="text-white/30 text-xs text-center mt-4">
          Merch, tickets, and info pages are always free — no email required.
        </p>
      </div>
    </div>
  );
}
