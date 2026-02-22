/**
 * VIDEO PLAYER - YouTube Embed with MyStation View Tracking
 * Includes lyrics overlay toggle
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Eye, ExternalLink, Share2, Heart, FileText, ChevronDown, ChevronUp, MessageCircle, Link2, Check, Mail } from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';
import CommentSection from './CommentSection';

// Sample lyrics - can be moved to data file
const videoLyrics = {
  'live-like-a-king': {
    title: 'Live Like A King',
    lyrics: `[Verse 1]
Started from the bottom, now I'm climbing to the top
Every single day I grind, I never gonna stop
Mama told me keep my head up, never look down
Cindy's son about to put it down for the town

[Chorus]
Live like a king, yeah that's how I'm living
Give everything, that's what I'm giving
Can't stop me now, I'm on my mission
Live like a king, this is my vision

[Verse 2]
From Elgin to Atlanta, I done made my way
Every single struggle made me who I am today
Foundation for the youth, that's what it's all about
Mike Page in the building, let me hear you shout

[Chorus]
Live like a king, yeah that's how I'm living
Give everything, that's what I'm giving
Can't stop me now, I'm on my mission
Live like a king, this is my vision

[Bridge]
They said I couldn't make it
But look at me now
Crown on my head
Wearing it proud

[Outro]
Live like a king...
Live like a king...
Yeah, live like a king...`,
  },
  // Add more video lyrics here
};

export default function VideoPlayer({ video, onClose }) {
  const { trackView, getViews } = useVideoStore();
  const [hasTracked, setHasTracked] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewCount = getViews(video.id);

  // Get lyrics for this video if available
  const lyrics = videoLyrics[video.id] || null;

  // Track view when video starts playing
  useEffect(() => {
    if (!hasTracked && video.youtubeId) {
      const timer = setTimeout(() => {
        trackView(video.id);
        setHasTracked(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [video.id, video.youtubeId, hasTracked, trackView]);

  if (!video) return null;

  const youtubeUrl = video.youtubeId
    ? `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`
    : null;

  const videoShareUrl = video.youtubeId
    ? `https://youtube.com/watch?v=${video.youtubeId}`
    : `https://mystationlive.com/videos`;
  const shareTitle = `${video.title} - Mike Page`;
  const shareText = `🎬 "${video.title}" - Mike Page\n\nWatch now!`;

  const copyVideoLink = async () => {
    try {
      await navigator.clipboard.writeText(videoShareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = videoShareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendVideoSMS = () => {
    const body = encodeURIComponent(`${shareText}\n\n🎧 ${videoShareUrl}`);
    window.location.href = `sms:?&body=${body}`;
  };

  const sendVideoEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${shareText}\n\n🎧 Watch here: ${videoShareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareVideoNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: videoShareUrl });
        return;
      } catch {}
    }
    copyVideoLink();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl overflow-y-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition z-10"
      >
        <X size={24} className="text-white" />
      </button>

      <div className="w-full max-w-5xl mx-6 my-8">
        {/* Video Container */}
        <div className="relative aspect-video bg-mystation-navy rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {youtubeUrl ? (
            <iframe
              src={youtubeUrl}
              title={video.title}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                <Play size={48} className="text-white/50 ml-2" />
              </div>
              <p className="text-white/50 text-lg">Video coming soon</p>
              <p className="text-white/30 text-sm mt-2">Check back for updates</p>
            </div>
          )}

          {/* Lyrics Overlay - slides up from bottom */}
          {showLyrics && lyrics && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/80 transition-all duration-300 ${
                lyricsExpanded ? 'h-full' : 'h-1/2'
              }`}
            >
              <div className="h-full flex flex-col">
                {/* Lyrics header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-400" />
                    <span className="text-white font-semibold">Lyrics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLyricsExpanded(!lyricsExpanded)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                      {lyricsExpanded ? (
                        <ChevronDown size={18} className="text-white" />
                      ) : (
                        <ChevronUp size={18} className="text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowLyrics(false)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                    >
                      <X size={18} className="text-white" />
                    </button>
                  </div>
                </div>

                {/* Lyrics content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {lyrics.lyrics}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{video.title}</h2>
            <p className="text-white/50">{video.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Eye size={18} />
                <span className="font-medium">{viewCount.toLocaleString()}</span>
                <span className="text-white/40 text-sm">MyStation views</span>
              </div>
              <span className="text-white/30">{video.year}</span>
              <span className="px-3 py-1 bg-white/10 rounded-full text-white/60 text-sm capitalize">
                {video.category.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Lyrics toggle button */}
            {lyrics && (
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={`p-3 rounded-xl transition flex items-center gap-2 ${
                  showLyrics
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <FileText size={20} />
                <span className="text-sm font-medium">Lyrics</span>
              </button>
            )}
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <Heart size={20} className="text-white" />
            </button>
            <button onClick={() => setShowShare(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <Share2 size={20} className="text-white" />
            </button>
            {video.youtubeId && (
              <a
                href={`https://youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition flex items-center gap-2"
              >
                <ExternalLink size={20} className="text-red-400" />
                <span className="text-red-400 text-sm font-medium">YouTube</span>
              </a>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 glass rounded-2xl overflow-hidden">
          <CommentSection
            trackId={`video-${video.id}`}
            trackTitle={video.title}
          />
        </div>

        {/* Lyrics Section Below Video (alternative view) */}
        {lyrics && !showLyrics && (
          <div className="mt-8">
            <button
              onClick={() => setShowLyrics(true)}
              className="w-full glass rounded-2xl p-6 text-left hover:border-blue-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <FileText size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">View Lyrics</h3>
                    <p className="text-white/50 text-sm">Read along while watching</p>
                  </div>
                </div>
                <ChevronUp size={24} className="text-white/40 group-hover:text-white transition" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="glass rounded-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">Share Video</h2>
                <p className="text-white/50 text-sm">{video.title}</p>
              </div>
              <button onClick={() => setShowShare(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition">
                <X size={20} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {/* Native Share / Instagram */}
              <button onClick={shareVideoNative} className="w-full flex items-center gap-4 p-4 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl border border-pink-500/30 transition">
                <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
                  <Share2 size={24} className="text-pink-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Share to Social</p>
                  <p className="text-sm text-white/50">Instagram, Twitter, and more</p>
                </div>
              </button>
              {/* SMS */}
              <button onClick={sendVideoSMS} className="w-full flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl border border-green-500/30 transition">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={24} className="text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Send via SMS</p>
                  <p className="text-sm text-white/50">Text the video link to anyone</p>
                </div>
              </button>
              {/* Email */}
              <button onClick={sendVideoEmail} className="w-full flex items-center gap-4 p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl border border-blue-500/30 transition">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail size={24} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">Send via Email</p>
                  <p className="text-sm text-white/50">Email the video link</p>
                </div>
              </button>
              {/* Copy Link */}
              <button onClick={copyVideoLink} className="w-full flex items-center gap-4 p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/30 transition">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  {copied ? <Check size={24} className="text-green-400" /> : <Link2 size={24} className="text-purple-400" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{copied ? 'Link Copied!' : 'Copy Link'}</p>
                  <p className="text-sm text-white/50">Share anywhere you want</p>
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">Sharing helps support the Mike Page Foundation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
