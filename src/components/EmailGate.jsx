/**
 * MYSTATION - Welcome Gate
 * First-visit welcome: Sign In / Sign Up / Browse as Guest (4 free songs)
 * Shows on ALL pages for new visitors. Dismissed once authenticated or guest mode chosen.
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, User, Loader2, Headphones, ArrowLeft, Music2 } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function EmailGate() {
  const { email: storedEmail, setEmail: setStoreEmail, setUser, isLoggedIn } = useUserStore();
  const [show, setShow] = useState(false);
  const [view, setView] = useState('welcome'); // 'welcome' | 'signin' | 'signup'
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

  const handleSignIn = async (e) => {
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

      // Store user + email
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      setStoreEmail(cleanEmail);
      if (data.user) {
        setUser(data.user);
      }

      // Start trial if they don't have one
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

      // Store user + email
      const cleanEmail = email.trim().toLowerCase();
      localStorage.setItem('mystation_email', cleanEmail);
      localStorage.setItem('mystation_email_captured', cleanEmail);
      setStoreEmail(cleanEmail);
      if (data.user) {
        setUser(data.user);
      }

      // Capture email for marketing + start trial
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
                Sign In
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
              <span className="text-white/30">(4 free songs)</span>
            </button>
          </div>
        )}

        {/* SIGN IN VIEW */}
        {view === 'signin' && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
            <button
              onClick={() => switchView('welcome')}
              className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <h2 className="text-xl font-bold text-white mb-6 text-center">Sign In</h2>

            <form onSubmit={handleSignIn} className="space-y-4">
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
              No account?{' '}
              <button onClick={() => switchView('signup')} className="text-blue-400 hover:text-blue-300 font-medium">
                Create one
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
              Get 24-hour free access. No credit card required.
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
              Already have an account?{' '}
              <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 font-medium">
                Sign in
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
