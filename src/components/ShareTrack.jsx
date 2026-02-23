/**
 * MYSTATION - Share Track Component
 * Send MP3/WAV files via SMS, Email, or any app
 */

'use client';

import { useState } from 'react';
import { Share2, Mail, MessageCircle, Link2, Check, X, Music, Loader2 } from 'lucide-react';
import { shareMP3 } from '@/lib/shareAudio';

export default function ShareTrack({ track }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [igCopied, setIgCopied] = useState(false);
  const [snapCopied, setSnapCopied] = useState(false);
  const [mp3Loading, setMp3Loading] = useState(false);

  // Always use production URL for sharing - never localhost
  const siteUrl = 'https://mystationlive.com';
  const trackUrl = `${siteUrl}/song/${track.id}`;

  // Share message - title prominent, encourages engagement back on site
  const shareTitle = `${track.title} - Mike Page`;
  const shareText = `🎵 "${track.title}" - Mike Page\n\nYou subscribing means the world to me. Independent PAGE, I'm nothing without you.`;

  // Open share modal - always show our custom modal with SMS/Email/Copy options
  const handleShare = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  // Send MP3 via native share sheet
  const handleSendMP3 = async () => {
    setMp3Loading(true);
    try {
      await shareMP3(track);
    } catch (err) {
      // User cancelled share or error - no action needed
    } finally {
      setMp3Loading(false);
    }
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = trackUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send via Email
  const sendEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n🎧 Listen here: ${trackUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Share to Instagram — use native share on mobile, copy link on desktop
  const shareToInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: trackUrl });
        return;
      } catch {}
    }
    // Fallback: copy link so user can paste in Instagram DM/Story
    try { await navigator.clipboard.writeText(trackUrl); } catch {}
    setIgCopied(true);
    setTimeout(() => setIgCopied(false), 3000);
  };

  // Share to Snapchat — use native share on mobile, copy link on desktop
  const shareToSnapchat = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: trackUrl });
        return;
      } catch {}
    }
    // Fallback: copy link so user can paste in Snapchat
    try { await navigator.clipboard.writeText(trackUrl); } catch {}
    setSnapCopied(true);
    setTimeout(() => setSnapCopied(false), 3000);
  };

  // Send via SMS (mobile) — use location.href for iOS/Android compatibility
  const sendSMS = () => {
    const body = encodeURIComponent(`${shareText}\n\n🎧 ${trackUrl}`);
    window.location.href = `sms:?&body=${body}`;
  };

  return (
    <>
      {/* Share Button - Always Visible */}
      <button
        onClick={handleShare}
        className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full transition border border-blue-500/30"
        title="Share track"
      >
        <Share2 size={16} />
      </button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Share Track</h2>
                <p className="text-white/50 text-sm">{track.title}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Share Options */}
            <div className="p-6 space-y-3">
              {/* Send MP3 - Featured Option */}
              <button
                onClick={handleSendMP3}
                disabled={mp3Loading}
                className="w-full flex items-center gap-4 p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/30 transition disabled:opacity-60"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  {mp3Loading ? (
                    <Loader2 size={24} className="text-orange-400 animate-spin" />
                  ) : (
                    <Music size={24} className="text-orange-400" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">
                    {mp3Loading ? 'Preparing audio...' : 'Send MP3'}
                  </p>
                  <p className="text-sm text-white/50">Share the actual audio file</p>
                </div>
              </button>

              {/* Instagram Stories */}
              <button
                onClick={shareToInstagram}
                className="w-full flex items-center gap-4 p-4 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl border border-pink-500/30 transition"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#f09433]/20 via-[#dc2743]/20 to-[#bc1888]/20 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{igCopied ? 'Link Copied!' : 'Share to Instagram'}</p>
                  <p className="text-sm text-white/50">{igCopied ? 'Paste in Instagram DM or Story' : 'Post to your Story or DM'}</p>
                </div>
              </button>

              {/* Snapchat */}
              <button
                onClick={shareToSnapchat}
                className="w-full flex items-center gap-4 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-xl border border-yellow-500/30 transition"
              >
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12.962-.252a.848.848 0 01.466-.053c.393.09.592.39.585.645-.006.216-.132.45-.363.563-.06.03-.396.18-.81.315-.636.21-1.2.45-1.365.57-.12.09-.186.18-.196.271-.018.18.066.33.106.405.24.45.57.87.93 1.275.705.81 1.65 1.515 2.1 1.74.345.165.345.435.345.525 0 .15-.075.33-.225.465-.3.27-.825.465-1.56.615-.18.03-.36.09-.495.15-.18.09-.21.21-.24.33l-.015.06c-.06.21-.12.39-.48.555-.42.195-1.065.27-1.89.36l-.24.03c-.12.015-.24.03-.36.06-.27.06-.48.24-.72.45-.39.36-.84.765-1.65.765h-.06c-.81 0-1.26-.405-1.65-.765-.24-.21-.45-.39-.72-.45-.12-.03-.24-.045-.36-.06l-.24-.03c-.78-.09-1.41-.15-1.83-.345-.39-.18-.45-.39-.51-.6l-.015-.06c-.03-.12-.06-.24-.24-.33-.135-.06-.315-.12-.495-.15-.735-.15-1.26-.345-1.56-.615-.15-.135-.225-.315-.225-.465 0-.09 0-.36.345-.525.45-.225 1.395-.93 2.1-1.74.36-.405.69-.825.93-1.275.04-.075.123-.225.105-.405-.01-.091-.075-.181-.195-.27-.165-.12-.73-.36-1.365-.57a7.39 7.39 0 01-.81-.315c-.24-.12-.36-.345-.36-.57 0-.255.21-.555.585-.645a.87.87 0 01.465.054c.3.12.66.24.96.252.21 0 .33-.045.405-.09a9.14 9.14 0 01-.03-.51l-.003-.06c-.105-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{snapCopied ? 'Link Copied!' : 'Share to Snapchat'}</p>
                  <p className="text-sm text-white/50">{snapCopied ? 'Paste in Snapchat to share' : 'Snap it to your friends'}</p>
                </div>
              </button>

              {/* SMS */}
              <button
                onClick={sendSMS}
                className="w-full flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl border border-green-500/30 transition"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={24} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Send via SMS</p>
                  <p className="text-sm text-white/50">Text the track link to anyone</p>
                </div>
              </button>

              {/* Email */}
              <button
                onClick={sendEmail}
                className="w-full flex items-center gap-4 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/30 transition"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail size={24} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Send via Email</p>
                  <p className="text-sm text-white/50">Email with download link</p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-4 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/30 transition"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  {copied ? (
                    <Check size={24} className="text-green-400" />
                  ) : (
                    <Link2 size={24} className="text-purple-400" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </p>
                  <p className="text-sm text-white/50">Share anywhere you want</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">
                Sharing helps support the Mike Page Foundation
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Compact inline share for track lists
export function ShareButton({ track }) {
  return <ShareTrack track={track} />;
}
