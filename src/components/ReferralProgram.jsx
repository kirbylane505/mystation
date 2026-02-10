/**
 * MYSTATION - Referral Program
 * Share link, both get 15% off merch
 */

'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, CheckCircle, Gift, Share2, LinkIcon } from 'lucide-react';

function generateReferralCode() {
  const stored = localStorage.getItem('mystation_referral_code');
  if (stored) return stored;
  const code = 'MST' + Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem('mystation_referral_code', code);
  return code;
}

export default function ReferralProgram({ className = '' }) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCode(generateReferralCode());
  }, []);

  if (!mounted) return null;

  const referralLink = `https://mystationlive.com?ref=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MyStation - Stream Mike Page Music Free',
          text: 'Check out MyStation! Use my link and we both get 15% off merch.',
          url: referralLink,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className={`glass rounded-2xl border border-white/10 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Users size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Invite Friends</h3>
          <p className="text-white/50 text-sm">Both get 15% off merch</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-blue-400 font-bold text-xs">1</span>
          </div>
          <span className="text-white/70">Share your unique link</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-purple-400 font-bold text-xs">2</span>
          </div>
          <span className="text-white/70">Friend visits MyStation</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="w-7 h-7 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-green-400 font-bold text-xs">3</span>
          </div>
          <span className="text-white/70">You both get <span className="text-green-400 font-bold">15% off</span> merch</span>
        </div>
      </div>

      {/* Referral Link */}
      <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl mb-3">
        <LinkIcon size={14} className="text-white/40 shrink-0" />
        <span className="text-white/60 text-sm truncate flex-1">{referralLink}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 p-2 bg-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/20 transition"
        >
          {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
        </button>
      </div>

      <button
        onClick={handleShare}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
      >
        <Share2 size={16} />
        Share Your Link
      </button>
    </div>
  );
}
