/**
 * Social Share Buttons
 * Share tracks on social media
 */

'use client';

import { useState } from 'react';
import { Share2, Twitter, Facebook, Link2, MessageCircle, Check, X, Camera } from 'lucide-react';

export default function ShareButtons({
  track,
  variant = 'icons', // icons, button, dropdown
  className = ''
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://mystationlive.com/song/${track?.id || ''}`;

  const shareText = track
    ? `🔥 Check out "${track.title}" by ${track.artist} on MyStation`
    : '🔥 Check out MyStation - Free music streaming';

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    instagram: shareUrl,
    snapchat: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`,
  };

  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    window.open('instagram://story-camera', '_blank');
    setTimeout(() => { window.open('https://instagram.com', '_blank'); }, 1500);
  };

  const shareToSnapchat = () => {
    window.open(shareLinks.snapchat, '_blank');
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
          onClick={shareToInstagram}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-gradient-to-br hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white transition"
          title="Share to Instagram"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </button>
        <button
          onClick={shareToSnapchat}
          className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:bg-[#FFFC00] hover:text-black transition"
          title="Share on Snapchat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.962-.252a.848.848 0 01.466-.053c.393.09.592.39.585.645-.006.216-.132.45-.363.563-.06.03-.396.18-.81.315-.636.21-1.2.45-1.365.57-.12.09-.186.18-.196.271-.018.18.066.33.106.405.24.45.57.87.93 1.275.705.81 1.65 1.515 2.1 1.74.345.165.345.435.345.525 0 .15-.075.33-.225.465-.3.27-.825.465-1.56.615-.18.03-.36.09-.495.15-.18.09-.21.21-.24.33l-.015.06c-.06.21-.12.39-.48.555-.42.195-1.065.27-1.89.36l-.24.03c-.12.015-.24.03-.36.06-.27.06-.48.24-.72.45-.39.36-.84.765-1.65.765h-.06c-.81 0-1.26-.405-1.65-.765-.24-.21-.45-.39-.72-.45-.12-.03-.24-.045-.36-.06l-.24-.03c-.78-.09-1.41-.15-1.83-.345-.39-.18-.45-.39-.51-.6l-.015-.06c-.03-.12-.06-.24-.24-.33-.135-.06-.315-.12-.495-.15-.735-.15-1.26-.345-1.56-.615-.15-.135-.225-.315-.225-.465 0-.09 0-.36.345-.525.45-.225 1.395-.93 2.1-1.74.36-.405.69-.825.93-1.275.04-.075.123-.225.105-.405-.01-.091-.075-.181-.195-.27-.165-.12-.73-.36-1.365-.57a7.39 7.39 0 01-.81-.315c-.24-.12-.36-.345-.36-.57 0-.255.21-.555.585-.645a.87.87 0 01.465.054c.3.12.66.24.96.252.21 0 .33-.045.405-.09a9.14 9.14 0 01-.03-.51l-.003-.06c-.105-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
        </button>
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
                onClick={() => { shareToInstagram(); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                <span className="text-white text-sm">Instagram</span>
              </button>
              <a
                href={shareLinks.snapchat}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition"
                onClick={() => setShowDropdown(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.962-.252a.848.848 0 01.466-.053c.393.09.592.39.585.645-.006.216-.132.45-.363.563-.06.03-.396.18-.81.315-.636.21-1.2.45-1.365.57-.12.09-.186.18-.196.271-.018.18.066.33.106.405.24.45.57.87.93 1.275.705.81 1.65 1.515 2.1 1.74.345.165.345.435.345.525 0 .15-.075.33-.225.465-.3.27-.825.465-1.56.615-.18.03-.36.09-.495.15-.18.09-.21.21-.24.33l-.015.06c-.06.21-.12.39-.48.555-.42.195-1.065.27-1.89.36l-.24.03c-.12.015-.24.03-.36.06-.27.06-.48.24-.72.45-.39.36-.84.765-1.65.765h-.06c-.81 0-1.26-.405-1.65-.765-.24-.21-.45-.39-.72-.45-.12-.03-.24-.045-.36-.06l-.24-.03c-.78-.09-1.41-.15-1.83-.345-.39-.18-.45-.39-.51-.6l-.015-.06c-.03-.12-.06-.24-.24-.33-.135-.06-.315-.12-.495-.15-.735-.15-1.26-.345-1.56-.615-.15-.135-.225-.315-.225-.465 0-.09 0-.36.345-.525.45-.225 1.395-.93 2.1-1.74.36-.405.69-.825.93-1.275.04-.075.123-.225.105-.405-.01-.091-.075-.181-.195-.27-.165-.12-.73-.36-1.365-.57a7.39 7.39 0 01-.81-.315c-.24-.12-.36-.345-.36-.57 0-.255.21-.555.585-.645a.87.87 0 01.465.054c.3.12.66.24.96.252.21 0 .33-.045.405-.09a9.14 9.14 0 01-.03-.51l-.003-.06c-.105-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
                <span className="text-white text-sm">Snapchat</span>
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
