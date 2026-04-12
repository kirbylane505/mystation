'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Radio } from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

export default function NamePrompt({ onSubmit }) {
  const { email, name } = useUserStore();
  const [displayName, setDisplayName] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Auto-fill if user already has a name/email
    if (name) { onSubmit(name); return; }
    if (email) { onSubmit(email.split('@')[0]); return; }
    // Check sessionStorage
    try {
      const saved = sessionStorage.getItem('podstation_name');
      if (saved) { onSubmit(saved); return; }
    } catch (e) {}
    setShow(true);
  }, [name, email, onSubmit]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    try { sessionStorage.setItem('podstation_name', trimmed); } catch (e) {}
    setShow(false);
    onSubmit(trimmed);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-mystation-navy border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
        <Radio className="w-10 h-10 text-orange-500 mx-auto mb-3" />
        <h2 className="text-white text-xl font-bold mb-1">Join the Stream</h2>
        <p className="text-gray-400 text-sm mb-4">Enter your name to chat and watch</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={!displayName.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
