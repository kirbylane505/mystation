'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Lock } from 'lucide-react';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Cookie set by API response — client-side navigate to preserve audio
        router.push('/');
      } else {
        setError('Incorrect password');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-mystation-navy to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">
            MY<span className="text-blue-400">STATION</span>
          </h1>
          <p className="text-gray-400 mt-2">Coming Soon</p>
        </div>

        {/* Password Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Lock size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Private Beta</h2>
              <p className="text-gray-400 text-sm">Enter password to access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Enter'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          IDMG Empire &copy; 2026
        </p>
      </div>
    </div>
  );
}
