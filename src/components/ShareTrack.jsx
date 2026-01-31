/**
 * MYSTATION - Share Track Component
 * Send MP3/WAV files via SMS, Email, or any app
 */

'use client';

import { useState } from 'react';
import { Share2, Mail, MessageCircle, Link2, Download, Check, X, Copy } from 'lucide-react';

export default function ShareTrack({ track, audioUrl }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  // Full URL for the track
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mystation.vercel.app';
  const trackUrl = `${siteUrl}/music?track=${track.id}`;
  const audioFileUrl = `${siteUrl}${audioUrl}`;

  // Share message
  const shareTitle = `${track.title} - Mike Page`;
  const shareText = `Check out "${track.title}" by Mike Page on MyStation! 🎵\n\nListen free & support the Mike Page Foundation.`;

  // Native Web Share API (works on mobile)
  const handleNativeShare = async () => {
    // Check if native share is supported
    if (navigator.share) {
      try {
        // Try sharing the audio file directly (works on some devices)
        if (navigator.canShare && audioUrl) {
          try {
            const response = await fetch(audioFileUrl);
            if (response.ok) {
              const blob = await response.blob();
              const file = new File([blob], `${track.title}.mp3`, { type: 'audio/mpeg' });

              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: shareTitle,
                  text: shareText,
                  files: [file]
                });
                return;
              }
            }
          } catch (fetchErr) {
            // Audio file fetch failed, continue to URL share
            console.log('Audio fetch skipped, sharing URL instead');
          }
        }

        // Fallback to sharing URL
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: trackUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Share failed or was cancelled, show modal as fallback
          setShowModal(true);
        }
      }
    } else {
      // No native share support, show modal
      setShowModal(true);
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
    const body = encodeURIComponent(`${shareText}\n\n🎧 Listen here: ${trackUrl}\n\n📥 Download: ${audioFileUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // Send via SMS (mobile)
  const sendSMS = () => {
    const body = encodeURIComponent(`${shareText}\n\n🎧 ${trackUrl}`);
    // sms: works on iOS and Android
    window.open(`sms:?body=${body}`, '_blank');
  };

  // Download file
  const downloadFile = async () => {
    if (!audioUrl) {
      alert('No audio file available for download');
      return;
    }

    try {
      // Get file extension from the audio URL
      const ext = audioUrl.split('.').pop() || 'wav';

      // Fetch the file first to ensure it's downloadable
      const response = await fetch(audioFileUrl);
      if (!response.ok) throw new Error('File not found');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.title} - Mike Page.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: try direct link download
      const a = document.createElement('a');
      a.href = audioFileUrl;
      a.download = `${track.title} - Mike Page.wav`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleNativeShare}
        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition"
        title="Share track"
      >
        <Share2 size={18} />
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

              {/* Download */}
              <button
                onClick={downloadFile}
                className="w-full flex items-center gap-4 p-4 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl border border-orange-500/30 transition"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Download size={24} className="text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Download File</p>
                  <p className="text-sm text-white/50">Save MP3/WAV to your device</p>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">
                Sharing helps support the Mike Page Foundation 💙
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Compact inline share for track lists
export function ShareButton({ track, audioUrl }) {
  return <ShareTrack track={track} audioUrl={audioUrl} />;
}
