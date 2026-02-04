/**
 * Email Capture - Newsletter Signup
 * "Get notified on new drops"
 */

'use client';

import { useState } from 'react';
import { Mail, Bell, CheckCircle, Loader2 } from 'lucide-react';

export default function EmailCapture({ variant = 'default', className = '' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    // Store in localStorage for now (will connect to Supabase)
    try {
      const subscribers = JSON.parse(localStorage.getItem('mystation_subscribers') || '[]');
      if (subscribers.includes(email)) {
        setStatus('success');
        setMessage("You're already on the list!");
        return;
      }
      subscribers.push(email);
      localStorage.setItem('mystation_subscribers', JSON.stringify(subscribers));

      setStatus('success');
      setMessage("You're in! We'll notify you on new drops.");
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  };

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          disabled={status === 'loading' || status === 'success'}
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
        >
          {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> :
           status === 'success' ? <CheckCircle size={20} /> : 'Join'}
        </button>
      </form>
    );
  }

  // Default variant - Full card
  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Bell size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Get Notified</h3>
          <p className="text-white/50 text-sm">New drops straight to your inbox</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle size={24} className="text-green-400" />
          <p className="text-green-400 font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
              disabled={status === 'loading'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Bell size={18} />
                Notify Me
              </>
            )}
          </button>
          {status === 'error' && (
            <p className="text-red-400 text-sm text-center">{message}</p>
          )}
          <p className="text-white/30 text-xs text-center">
            No spam. Only fire music.
          </p>
        </form>
      )}
    </div>
  );
}
