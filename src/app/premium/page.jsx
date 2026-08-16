'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PremiumPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [sessionEmail, setSessionEmail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const { user } = await res.json();
        if (!cancelled && user?.email) {
          setSessionEmail(user.email);
          setEmail(user.email);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function startCheckout(e) {
    e?.preventDefault?.();
    setError(null);
    if (!agreed) { setError('Please agree to the 6-month commitment.'); return; }
    if (!email) { setError('Email required for receipts and Stripe billing.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'premium', email, commitment_agreed: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Failed to start checkout.');
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Try again.');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-white">
      <Link href="/" className="text-white/60 hover:text-white text-sm">← Back</Link>
      <h1 className="text-4xl md:text-5xl font-black mt-4 mb-3">MyStation Premium</h1>
      <p className="text-xl text-white/80 mb-8">
        $4.99/month. Everything you love + free & discounted tickets to IDMG events.
      </p>

      <ul className="space-y-3 mb-8 text-lg">
        <li className="flex gap-3"><span>🎟️</span><span>Free or discounted tickets to LOTL, IDMG showcases, MPF events</span></li>
        <li className="flex gap-3"><span>🏆</span><span>Supporter badge on your profile</span></li>
        <li className="flex gap-3"><span>💬</span><span>VIP color + priority in Live Chat</span></li>
        <li className="flex gap-3"><span>🚀</span><span>Early access — new features 2 weeks before anyone else</span></li>
      </ul>

      <form onSubmit={startCheckout} className="space-y-5">
        {!sessionEmail && (
          <div>
            <label className="block text-sm text-white/70 mb-2">Email for receipts</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full bg-neutral-900 border border-white/10 rounded-lg px-4 py-3 text-white"
            />
          </div>
        )}

        <div className="bg-neutral-900 rounded-xl p-5 border border-white/10">
          <label className="flex gap-3 items-start cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5"
            />
            <span className="text-sm text-white/80">
              I agree to a <b className="text-white">6-month commitment</b> ($29.94 total, billed as $4.99/month). After 6 months it continues month-to-month and I can cancel anytime.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 text-red-200 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!agreed || loading}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black rounded-full text-xl font-black disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Loading…' : 'Start Premium — $4.99/mo'}
        </button>

        <p className="text-xs text-white/40 text-center">
          Secure checkout by Stripe. Cancel anytime after the 6-month commitment ends.
        </p>
      </form>
    </main>
  );
}
