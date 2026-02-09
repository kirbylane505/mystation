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
  const [mp3Loading, setMp3Loading] = useState(false);

  // Always use production URL for sharing - never localhost
  const siteUrl = 'https://mystationlive.com';
  const trackUrl = `${siteUrl}/song/${track.id}`;

  // Share message - title prominent, encourages engagement back on site
  const shareTitle = `${track.title} - Mike Page`;
  const shareText = `🎵 "${track.title}" - Mike Page\n\nTap to listen & drop a 🔥 if it's fire!`;

  // Open share modal - always show our custom modal with SMS/Email/Copy options
  const handleShare = () => {
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
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Send via SMS (mobile)
  const sendSMS = () => {
    const body = encodeURIComponent(`${shareText}\n\n🎧 ${trackUrl}`);
    // sms: works on iOS and Android
    window.open(`sms:?body=${body}`, '_blank');
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full animate-scale-in">
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
