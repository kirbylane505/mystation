/**
 * MYSTATION - Account Wall
 * Sign in, sign up, or enter access code overlay.
 * Shows only when triggered from navbar sign-in button (showAccountWall).
 *
 * SIGN IN = EMAIL ONLY for subscribers. No password needed.
 * If not a subscriber, offers sign up or password login fallback.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePlayerStore, useUserStore } from '@/store/playerStore';

// Pages that should NEVER be blocked by the account wall (commerce, ticketing, admin)
const OPEN_PATHS = ['/events', '/tickets', '/admin', '/merch'];
import Link from 'next/link';
import { Mail, Lock, User, Loader2, Headphones, ShoppingBag, Ticket } from 'lucide-react';

// Stripe checkout links per tier — MyStation LLC (acct_1T1jP1R0BloCNd9r)
const STRIPE_LINKS = {
  regular: 'https://buy.stripe.com/5kQbJ3fyX0l0gLafHd1oI00',
};

export default function AccountWall() {
  const pathname = usePathname();
  const { setShowAccountWall, showAccountWall } = usePlayerStore();
  const { isLoggedIn, isSubscribed, setUser, setEmail: setStoreEmail, subscribe, freeSignupSlotsRemaining, setFreeSignupSlots } = useUserStore();

  const [view, setView] = useState('signin'); // 'signup' | 'signin' | 'code' | 'password'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');

  // Fetch real signup slot count from DB on mount
  useEffect(() => {
    fetch('/api/auth/signup-slots')
      .then(r => r.json())
      .then(data => {
        if (typeof data.remaining === 'number') {
          setFreeSignupSlots(data.remaining);
        }
      })
      .catch(() => {});
  }, [setFreeSignupSlots]);

  // Ticketing/admin pages are always open — no wall for ticket buyers
  const isOpenPath = OPEN_PATHS.some(p => pathname?.startsWith(p));
  if (isOpenPath) return null;

  // Show wall only when explicitly triggered (navbar sign-in button)
  const shouldShow = showAccountWall;
  if (!shouldShow) return null;

  const clearError = () => { setErrorMsg(''); setSuccessMsg(''); };

  // EMAIL-ONLY sign in for subscribers
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
        // Subscriber found and active — logged in!
        const cleanEmail = email.trim().toLowerCase();
        localStorage.setItem('mystation_email', cleanEmail);
        localStorage.setItem('mystation_user', JSON.stringify(data.user));
        setStoreEmail(cleanEmail);
        setUser(data.user);
        if (data.isSubscribed) subscribe(cleanEmail, data.tier || 'regular');
        setShowAccountWall(false);
        return;
      }

      // Not found or expired — show helpful message
      if (data.notFound) {
        setErrorMsg('No subscription found. Sign up to get started!');
        setTimeout(() => switchView('signup'), 2000);
      } else if (data.expired) {
        setErrorMsg('Subscription expired. Resubscribe to continue!');
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
      localStorage.setItem('mystation_user', JSON.stringify(data.user));
      setStoreEmail(cleanEmail);
      setUser(data.user);
      setShowAccountWall(false);
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
      localStorage.setItem('mystation_user', JSON.stringify(data.user));
      setStoreEmail(cleanEmail);
      setUser(data.user);

      // Email capture (fire-and-forget)
      fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, source: 'signup' }),
      }).catch(() => {});

      if (data.isFreeSlot) {
        // Free month — every new subscriber gets 30-day trial
        subscribe(cleanEmail, 'regular');
        setFreeSignupSlots(data.freeSignupSlots || 0);
        setSuccessMsg(`Welcome! You're member #${data.subscriberNumber} — first month FREE!`);
        setTimeout(() => {
          setShowAccountWall(false);
          setSuccessMsg('');
        }, 2500);
      } else if (data.needsPayment) {
        // After 26 — redirect to Stripe
        setShowAccountWall(false);
        window.location.href = STRIPE_LINKS.regular;
      } else {
        setShowAccountWall(false);
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCode = async () => {
    if (!accessCode.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/access-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        subscribe('friend@mystation.com');
        setShowAccountWall(false);
      } else {
        setErrorMsg('Invalid code. Try again.');
      }
    } catch {
      setErrorMsg('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView) => {
    setView(newView);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <Headphones size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MyStation</h1>
          <p className="text-white/50 text-sm mt-1">by IDMG</p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-6 text-center mb-4">
            <p className="text-green-400 font-bold text-lg">{successMsg}</p>
          </div>
        )}

        {!successMsg && (
          <div className="bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

            {/* ===== SIGN IN VIEW (EMAIL ONLY — DEFAULT) ===== */}
            {view === 'signin' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-white/50 text-sm">Subscribers — just enter your email</p>
                </div>

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

                  {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 text-lg"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 space-y-3 text-center">
                  <p className="text-white/40 text-sm">
                    New here?{' '}
                    <button onClick={() => switchView('signup')} className="text-blue-400 hover:text-blue-300 font-medium">
                      Sign up — First Month FREE
                    </button>
                  </p>
                  <p className="text-white/30 text-xs">
                    <button onClick={() => switchView('password')} className="text-white/40 hover:text-white/60 transition">
                      Sign in with password instead
                    </button>
                  </p>
                  <button
                    onClick={() => switchView('code')}
                    className="text-blue-400/60 text-xs hover:text-blue-400 transition"
                  >
                    Have an access code?
                  </button>
                </div>
              </>
            )}

            {/* ===== PASSWORD SIGN IN (FALLBACK) ===== */}
            {view === 'password' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Sign In With Password</h2>
                </div>

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

                  {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Back to email sign in
                  </button>
                </div>
              </>
            )}

            {/* ===== SIGN UP VIEW ===== */}
            {view === 'signup' && (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Join MyStation</h2>
                  {freeSignupSlotsRemaining > 0 ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 font-bold text-sm">
                        {freeSignupSlotsRemaining} of 26 free spots remaining!
                      </span>
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">
                      $4.99/mo for unlimited access — first month FREE
                    </p>
                  )}
                </div>

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

                  {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                      'Sign Up — First Month FREE'
                    )}
                  </button>
                </form>

                <div className="mt-6 space-y-2 text-center">
                  <p className="text-white/40 text-sm">
                    Already subscribed?{' '}
                    <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 font-medium">
                      Sign in with email
                    </button>
                  </p>
                  <button
                    onClick={() => switchView('code')}
                    className="text-blue-400/60 text-xs hover:text-blue-400 transition"
                  >
                    Have an access code?
                  </button>
                </div>
              </>
            )}

            {/* ===== ACCESS CODE VIEW ===== */}
            {view === 'code' && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold text-white mb-2">Access Code</h2>
                  <p className="text-white/60 text-sm">Enter your code for free unlimited streaming</p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => { setAccessCode(e.target.value); clearError(); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAccessCode()}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 uppercase tracking-wider"
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    onClick={handleAccessCode}
                    disabled={loading || !accessCode.trim()}
                    className="px-6 py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition disabled:opacity-50"
                  >
                    {loading ? '...' : 'Go'}
                  </button>
                </div>
                {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}

                <div className="mt-4 text-center">
                  <button onClick={() => switchView('signin')} className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                    Back to sign in
                  </button>
                </div>
              </div>
            )}

            {/* Commerce links — always accessible, no subscription needed */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <Link href="/merch" className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition">
                <ShoppingBag size={15} />
                Shop Merch
              </Link>
              <Link href="/events" className="flex items-center gap-1.5 text-white/50 hover:text-white text-sm transition">
                <Ticket size={15} />
                Buy Tickets
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
