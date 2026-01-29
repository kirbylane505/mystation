/**
 * VIDEO PLAYER - YouTube Embed with MyStation View Tracking
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Eye, ExternalLink, Share2, Heart } from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';

export default function VideoPlayer({ video, onClose }) {
  const { trackView, getViews } = useVideoStore();
  const [hasTracked, setHasTracked] = useState(false);
  const viewCount = getViews(video.id);

  // Track view when video starts playing
  useEffect(() => {
    if (!hasTracked && video.youtubeId) {
      // Small delay to ensure actual viewing intent
      const timer = setTimeout(() => {
        trackView(video.id);
        setHasTracked(true);
      }, 3000); // Track after 3 seconds of viewing

      return () => clearTimeout(timer);
    }
  }, [video.id, video.youtubeId, hasTracked, trackView]);

  if (!video) return null;

  const youtubeUrl = video.youtubeId
    ? `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition z-10"
      >
        <X size={24} className="text-white" />
      </button>

      <div className="w-full max-w-5xl mx-6">
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
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
              <Heart size={20} className="text-white" />
            </button>
            <button className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition">
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
      </div>
    </div>
  );
}
