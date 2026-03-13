'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'musician', label: 'Musician' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'content_creator', label: 'Content Creator' },
];

export default function CreatorSignup() {
  const [form, setForm] = useState({ email: '', password: '', displayName: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/creators/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      // Store email for onboarding
      document.cookie = `mystation-email=${encodeURIComponent(form.email)};path=/;max-age=${365 * 86400}`;

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join MyStation</h1>
          <p className="text-[#71717a]">$14.99/mo — Upload music, sell merch, build your audience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Artist / Brand Name</label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={update('displayName')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="Your name or brand"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm text-[#a1a1aa] mb-2">What do you do?</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`px-3 py-3 rounded-lg border text-sm font-medium transition-all ${
                    form.category === cat.value
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !form.category}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Setting up...' : 'Start Creating — $14.99/mo'}
          </button>

          <p className="text-center text-[#71717a] text-sm">
            Already a creator?{' '}
            <Link href="/dashboard" className="text-[#D4AF37] hover:underline">
              Go to Dashboard
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
