'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OnboardingContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];
    if (stored) setEmail(decodeURIComponent(stored));
  }, []);

  const handleConnect = async () => {
    if (!email) return;
    setLoading(true);

    try {
      const res = await fetch('/api/creators/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start onboarding');
      }
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, Creator!</h1>
          <p className="text-[#71717a]">Your subscription is active. One more step to start earning.</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Bank Account</h2>
          <p className="text-[#a1a1aa] text-sm mb-4">
            Link your bank via Stripe so you can receive merch payouts directly. You keep 100% of your merch revenue.
          </p>

          {!email && (
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white mb-4 focus:border-[#D4AF37] focus:outline-none"
            />
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !email}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all mb-3"
          >
            {loading ? 'Connecting...' : 'Connect Bank Account'}
          </button>

          <button
            onClick={handleSkip}
            className="w-full py-2 text-[#71717a] text-sm hover:text-white transition-colors"
          >
            Skip for now — I'll set this up later
          </button>
        </div>

        <p className="text-[#52525b] text-xs">
          Powered by Stripe Connect. Your banking info is never shared with MyStation.
        </p>
      </div>
    </div>
  );
}

export default function CreatorOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <OnboardingContent />
    </Suspense>
  );
}
