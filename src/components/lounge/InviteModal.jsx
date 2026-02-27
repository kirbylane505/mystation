/**
 * KICKBACK LOUNGE — Premium Invite Modal (Portal)
 * Jackbox-style giant room code, SMS/share options, animated
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Share2, Check, X, Link2, MessageCircle, Mail } from 'lucide-react';

export default function InviteModal({ roomCode, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ESC to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen) return null;

  const inviteUrl = `${window.location.origin}/lounge/invite/${roomCode}`;
  const shareText = `Come play in the Kickback Lounge! Room code: ${roomCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const input = document.createElement('input');
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSMS = () => {
    window.open(`sms:?&body=${encodeURIComponent(`${shareText}\n${inviteUrl}`)}`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent('Join my game on MyStation!')}&body=${encodeURIComponent(`${shareText}\n\n${inviteUrl}`)}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my game on MyStation!',
          text: shareText,
          url: inviteUrl,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative bg-[#0d1117] border border-white/[0.08] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'loungeFadeUp 0.35s ease-out' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/70 transition-all z-10"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-2 px-6">
          <h2 className="text-white font-black text-xl mb-1">Invite Friends</h2>
          <p className="text-white/30 text-sm">Share the code or link below</p>
        </div>

        {/* Giant Room Code */}
        <div className="px-6 py-6 text-center">
          <p className="text-white/25 text-xs uppercase tracking-[0.2em] font-semibold mb-3">Room Code</p>
          <div
            className="inline-block bg-white/[0.04] border border-white/[0.08] rounded-2xl px-10 py-5"
            style={{ animation: 'loungeFadeUp 0.4s ease-out 0.1s both' }}
          >
            <span className="text-5xl md:text-6xl font-black text-white tracking-[0.35em] font-mono select-all">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Invite Link */}
        <div className="px-6 mb-5">
          <div className="flex items-center gap-2 p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <Link2 size={14} className="text-white/25 shrink-0" />
            <span className="text-white/40 text-xs truncate flex-1 font-mono">{inviteUrl}</span>
            <button
              onClick={handleCopy}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-white/[0.06] text-white/50 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* Share Options — 4 buttons */}
        <div className="px-6 pb-6 grid grid-cols-4 gap-2.5">
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1.5 p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            {copied ? (
              <Check size={20} className="text-green-400" />
            ) : (
              <Copy size={20} className="text-white/40 group-hover:text-white/70 transition" />
            )}
            <span className="text-white/30 text-[10px] font-medium">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>

          <button
            onClick={handleSMS}
            className="flex flex-col items-center gap-1.5 p-3.5 bg-white/[0.03] hover:bg-green-500/10 border border-white/[0.06] hover:border-green-500/20 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <MessageCircle size={20} className="text-green-400/60 group-hover:text-green-400 transition" />
            <span className="text-white/30 text-[10px] font-medium">SMS</span>
          </button>

          <button
            onClick={handleEmail}
            className="flex flex-col items-center gap-1.5 p-3.5 bg-white/[0.03] hover:bg-blue-500/10 border border-white/[0.06] hover:border-blue-500/20 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <Mail size={20} className="text-blue-400/60 group-hover:text-blue-400 transition" />
            <span className="text-white/30 text-[10px] font-medium">Email</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1.5 p-3.5 bg-white/[0.03] hover:bg-purple-500/10 border border-white/[0.06] hover:border-purple-500/20 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 group"
          >
            <Share2 size={20} className="text-purple-400/60 group-hover:text-purple-400 transition" />
            <span className="text-white/30 text-[10px] font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
