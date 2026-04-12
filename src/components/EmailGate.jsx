/**
 * MYSTATION - Welcome Gate
 * First-visit welcome: Sign In (email only) / Sign Up / Browse as Guest
 * Shows on ALL pages for new visitors. Dismissed once authenticated or guest mode chosen.
 *
 * SIGN IN = EMAIL ONLY for subscribers. No password needed.
 * Just enter your email — if you're subscribed, you're in.
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, User, Loader2, Headphones, ArrowLeft, Music2 } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function EmailGate() {
  const { email: storedEmail, setEmail: setStoreEmail, setUser, isLoggedIn, subscribe } = useUserStore();
  const [show, setShow] = useState(false);
  const [view, setView] = useState('welcome'); // 'welcome' | 'signin' | 'signup' | 'password'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already logged in via zustand
    if (isLoggedIn && storedEmail) {
      setShow(false);
      return;
    }

    // Already has email stored (returning visitor)
    const savedEmail = localStorage.getItem('mystation_email');
    if (savedEmail) {
      setShow(false);
      return;
    }

    // Guest mode already chosen this browser
    const isGuest = localStorage.getItem('mystation_guest');
    if (isGuest) {
      setShow(false);
      return;
    }

    // New visitor — show welcome gate
    setShow(true);
  }, [isLoggedIn, storedEmail]);

  const clearError = () => { setErrorMsg(''); };

  // EMAIL-ONLY sign in for subscribers — no password needed
  const handleSubscriberSignIn = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Enter your email');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/subscriber-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (data.success) {
        // Subscriber found — logged in!
        const cleanEmail = email.trim().toLowerCase();
        localStorage.setItem('mystation_email', cleanEmail);
        localStorage.setItem('mystation_user', JSON.stringify(data.user));
        setStoreEmail(cleanEmail);
        setUser(data.user);
        if (data.isSubscribed) subscribe(cleanEmail, data.tier || 'supporter');
        setShow(false);
        return;
      }

      // Not found or expired
      if (data.notFound) {
        setErrorMsg('No subscription found for this email.');
        // Don't auto-redirect — let them choose
      } else if (data.expired) {
        setErrorMsg('Your subscription has expired. Sign up to resubscribe!');
      } else {
        setErrorMsg(data.error || 'Could not sign in');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password sign in (fallback)
  const handlePasswordSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email and password required');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      setStoreEmail(cleanEmail);
      if (data.user) setUser(data.user);

      fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      }).catch(() => {});

      setShow(false);
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email and password required');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Could not create account');
        setLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      localStorage.setItem('mystation_email_captured', cleanEmail);
      setStoreEmail(cleanEmail);
      if (data.user) setUser(data.user);

      fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'signup' }),
      }).catch(() => {});

      fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      }).catch(() => {});

      setShow(false);
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    localStorage.setItem('mystation_guest', 'true');
    setShow(false);
  };

  const switchView = (newView) => {
    setView(newView);
    setErrorMsg('');
    setPassword('');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Headphones size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MyStation</h1>
          <p className="text-white/50 text-sm mt-1">by IDMG</p>
        </div>

        {/* WELCOME VIEW */}
        {view === 'welcome' && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Welcome to MyStation</h2>
              <p className="text-white/50 text-sm">
                Stream music, explore playlists, shop merch, and more.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => switchView('signin')}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-lg"
              >
                <Mail size={20} />
                Sign In With Email
              </button>

              <button
                onClick={() => switchView('signup')}
                className="w-full py-4 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/15 transition flex items-center justify-center gap-2 text-lg"
              >
                Create Account
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#0a0a14] text-white/40">or</span>
              </div>
            </div>

            <button
              onClick={handleGuest}
              className="w-full py-3 text-white/60 hover:text-white transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <Music2 size={16} />
              Browse as Guest
              <span className="text-white/30">(2 free songs)</span>
            </button>
          </div>
        )}

        {/* SIGN IN VIEW — EMAIL ONLY (no password!) */}
        {view === 'signin' && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <button
              onClick={() => switchView('welcome')}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h2 className="text-xl font-bold text-white mb-2 text-center">Sign In</h2>
            <p className="text-white/50 text-sm text-center mb-6">
              Subscribers, just enter your email. No password needed.
            </p>

            <form onSubmit={handleSubscriberSignIn} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition text-lg"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-lg"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-white/40 text-sm">
                No account?{' '}
                <button onClick={() => switchView('signup')} className="text-blue-400 hover:text-blue-300 font-medium">
                  Create one
                </button>
              </p>
              <p className="text-white/30 text-xs">
                <button onClick={() => switchView('password')} className="text-white/40 hover:text-white/60 transition">
                  Sign in with password instead
                </button>
              </p>
            </div>
          </div>
        )}

        {/* PASSWORD SIGN IN (FALLBACK) */}
        {view === 'password' && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <button
              onClick={() => switchView('signin')}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In With Password</h2>

            <form onSubmit={handlePasswordSignIn} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  required
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-4">
              <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 font-medium">
                Back to email sign in
              </button>
            </p>
          </div>
        )}

        {/* SIGN UP VIEW */}
        {view === 'signup' && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <button
              onClick={() => switchView('welcome')}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h2 className="text-xl font-bold text-white mb-2 text-center">Create Account</h2>
            <p className="text-white/50 text-sm text-center mb-6">
              Get free access. No credit card required.
            </p>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder="Email"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="Password (6+ characters)"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-4">
              Already subscribed?{' '}
              <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in with email
              </button>
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-white/20 text-xs text-center mt-4">
          Merch, tickets, and info pages are always free.
        </p>
      </div>
    </div>
  );
}
