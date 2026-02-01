/**
 * MYSTATION - Auth Modal (Sign Up / Sign In)
 * Email-based authentication with supporter tiers
 */

'use client';

import { useState } from 'react';
import { X, Mail, Lock, User, Check, Heart, Music, Sparkles } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function AuthModal({ isOpen, onClose, initialMode = 'signup' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { setUser } = useUserStore();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate auth - in production, connect to backend
    setTimeout(() => {
      const user = {
        id: Date.now(),
        email,
        name: name || email.split('@')[0],
        tier: 'free',
        joinedAt: new Date().toISOString()
      };

      // Store in localStorage
      localStorage.setItem('mystation_user', JSON.stringify(user));
      setUser(user);
      setSuccess(true);
      setLoading(false);

      // Close modal after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }, 1000);
  };

  const benefits = [
    { icon: Music, text: "Free unlimited streaming" },
    { icon: Heart, text: "Save your favorite tracks" },
    { icon: Sparkles, text: "Early access to new releases" },
    { icon: Check, text: "Support the Foundation" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-mystation-navy to-mystation-darker rounded-3xl border border-white/10 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Music size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'signup' ? 'Join MyStation' : 'Welcome Back'}
          </h2>
          <p className="text-white/60 text-sm">
            {mode === 'signup'
              ? 'Create a free account to save favorites and support the Foundation'
              : 'Sign in to access your account'}
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="px-8 py-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={40} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {mode === 'signup' ? 'Welcome to MyStation!' : 'Signed In!'}
            </h3>
            <p className="text-white/60">Redirecting...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {mode === 'signup' && (
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-white/60 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                mode === 'signup' ? 'Create Free Account' : 'Sign In'
              )}
            </button>

            {/* Benefits (signup only) */}
            {mode === 'signup' && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Free account includes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/60 text-sm">
                      <b.icon size={14} className="text-blue-400" />
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggle mode */}
            <div className="mt-6 text-center">
              <p className="text-white/40 text-sm">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                  className="text-blue-400 hover:text-blue-300 ml-2 font-medium"
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up Free'}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Foundation note */}
        <div className="px-8 py-4 bg-blue-500/5 border-t border-white/5 text-center">
          <p className="text-white/40 text-xs">
            <Heart size={12} className="inline mr-1" />
            MyStation supports the Mike Page Foundation 501(c)(3)
          </p>
        </div>
      </div>
    </div>
  );
}
