/**
 * Social Share Buttons
 * Share tracks on social media
 */

'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link2, MessageCircle, Check, X } from 'lucide-react';

export default function ShareButtons({
  track,
  variant = 'icons', // icons, button, dropdown
  className = ''
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${track?.id || ''}`
    : '';

  const shareText = track
    ? `🔥 Check out "${track.title}" by ${track.artist} on MyStation`
    : '🔥 Check out MyStation - Free music streaming';

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: track?.title || 'MyStation',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        setShowDropdown(true);
      }
    } else {
      setShowDropdown(true);
    }
  };

  // Icons variant - horizontal row
  if (variant === 'icons') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-[#1DA1F2] hover:text-white transition"
          title="Share on Twitter"
        >
          <Twitter size={16} />
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-[#4267B2] hover:text-white transition"
          title="Share on Facebook"
        >
          <Facebook size={16} />
        </a>
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-[#25D366] hover:text-white transition"
          title="Share on WhatsApp"
        >
          <MessageCircle size={16} />
        </a>
        <button
          onClick={copyLink}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
          }`}
          title="Copy link"
        >
          {copied ? <Check size={16} /> : <Link2 size={16} />}
        </button>
      </div>
    );
  }

  // Button variant - single share button with dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition"
      >
        <Share2 size={16} />
        <span className="text-sm font-medium">Share</span>
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute bottom-full mb-2 right-0 w-48 glass rounded-xl overflow-hidden z-50 animate-fade-in">
            <div className="p-2">
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                onClick={() => setShowDropdown(false)}
              >
                <Twitter size={18} className="text-[#1DA1F2]" />
                <span className="text-white text-sm">Twitter</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                onClick={() => setShowDropdown(false)}
              >
                <Facebook size={18} className="text-[#4267B2]" />
                <span className="text-white text-sm">Facebook</span>
              </a>
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                onClick={() => setShowDropdown(false)}
              >
                <MessageCircle size={18} className="text-[#25D366]" />
                <span className="text-white text-sm">WhatsApp</span>
              </a>
              <button
                onClick={() => { copyLink(); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                <Link2 size={18} className="text-white/60" />
                <span className="text-white text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
