'use client';

import { useState, useEffect } from 'react';

export default function DashboardVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (email) {
      fetch(`/api/creators/videos?email=${encodeURIComponent(decodeURIComponent(email))}`)
        .then((r) => r.json())
        .then((data) => setVideos(data.videos || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const hideVideo = async (id) => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];
    if (!email) return;

    await fetch('/api/creators/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: decodeURIComponent(email), id, status: 'hidden' }),
    });

    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">My Videos</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#27272a]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#27272a] rounded w-3/4" />
                <div className="h-3 bg-[#27272a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">My Videos</h1>
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-[#27272a] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-[#71717a] text-lg">No videos yet.</p>
          <p className="text-[#52525b] text-sm mt-1">Go live on PodStation and save your streams!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Videos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden group">
            {/* Video Preview */}
            <div className="aspect-video bg-[#09090b] relative">
              {video.video_url ? (
                <video
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  onMouseEnter={(e) => e.target.play().catch(() => {})}
                  onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-[#27272a]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="text-white font-medium text-sm truncate">{video.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3 text-xs text-[#71717a]">
                  <span>{formatDate(video.created_at)}</span>
                  {video.view_count !== undefined && (
                    <span>{video.view_count.toLocaleString()} views</span>
                  )}
                </div>
                <button
                  onClick={() => hideVideo(video.id)}
                  className="text-xs text-[#71717a] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
