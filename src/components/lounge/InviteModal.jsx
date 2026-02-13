/**
 * KICKBACK LOUNGE — Invite Modal
 * Copy invite link + native share
 */

'use client';

import { useState } from 'react';
import { Copy, Share2, Check, X, Link2 } from 'lucide-react';

export default function InviteModal({ roomCode, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/lounge/invite/${roomCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my game on MyStation!',
          text: `Come play in the Kickback Lounge! Room code: ${roomCode}`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-mystation-navy border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Invite Friends</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
            <X size={20} className="text-white/50" />
          </button>
        </div>

        {/* Room Code */}
        <div className="text-center mb-6">
          <p className="text-white/50 text-sm mb-2">Room Code</p>
          <div className="text-4xl font-black text-white tracking-[0.3em] bg-white/5 rounded-xl py-3">
            {roomCode}
          </div>
        </div>

        {/* Invite Link */}
        <div className="flex items-center gap-2 mb-6 p-3 bg-white/5 rounded-xl border border-white/10">
          <Link2 size={16} className="text-white/40 shrink-0" />
          <span className="text-white/60 text-sm truncate flex-1">{inviteUrl}</span>
          <button
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition"
          >
            <Share2 size={18} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
