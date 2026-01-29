/**
 * VIDEOS PAGE - MyStation Video Hub
 * Watch videos and track views within the app
 */

'use client';

import { useState, useEffect } from 'react';
import { Play, Eye, ExternalLink, TrendingUp, Film, Youtube } from 'lucide-react';
import { videos, videoCategories, youtubeChannel } from '@/data/videos';
import { useVideoStore } from '@/store/videoStore';
import VideoPlayer from '@/components/VideoPlayer';
import Link from 'next/link';

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentVideo, setCurrentVideo] = useState(null);
  const { getViews, getTotalViews, getTopVideos } = useVideoStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter videos by category
  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(v => v.category === selectedCategory);

  // Featured videos
  const featuredVideos = videos.filter(v => v.featured);

  // Get YouTube thumbnail
  const getThumbnail = (video) => {
    if (video.thumbnail) return video.thumbnail;
    if (video.youtubeId) return `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
    return null;
  };

  const totalViews = mounted ? getTotalViews() : 0;
  const topVideos = mounted ? getTopVideos(3) : [];

  return (
    <div className="min-h-screen pt-24 pb-32">
      {/* Header */}
      <section className="max-w-screen-xl mx-auto px-6 mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Film size={28} className="text-red-400" />
              </div>
              <h1 className="text-4xl font-bold text-white">Videos</h1>
            </div>
            <p className="text-white/50 text-lg">
              Music videos, behind the scenes, and exclusive content
            </p>
          </div>

          {/* Stats Card */}
          <div className="glass rounded-2xl p-6 flex gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold gradient-text">{totalViews.toLocaleString()}</p>
              <p className="text-white/40 text-sm">MyStation Views</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{videos.length}</p>
              <p className="text-white/40 text-sm">Videos</p>
            </div>
            <div className="w-px bg-white/10" />
            <a
              href={youtubeChannel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center hover:scale-105 transition"
            >
              <Youtube size={32} className="text-red-500 mb-1" />
              <p className="text-white/40 text-sm">YouTube</p>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp size={24} className="text-blue-400" />
            Featured
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVideos.slice(0, 3).map(video => (
              <div
                key={video.id}
                onClick={() => setCurrentVideo(video)}
                className="glass rounded-2xl overflow-hidden hover:border-blue-500/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative bg-gradient-to-br from-blue-900 to-indigo-900">
                  {getThumbnail(video) ? (
                    <img
                      src={getThumbnail(video)}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film size={48} className="text-white/20" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50">
                      <Play size={28} className="text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Featured Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    FEATURED
                  </div>

                  {/* View count */}
                  {mounted && getViews(video.id) > 0 && (
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/70 text-white text-xs rounded-full flex items-center gap-1">
                      <Eye size={12} />
                      {getViews(video.id).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{video.title}</h3>
                  <p className="text-white/40 text-sm line-clamp-2">{video.description}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-white/30 text-sm">{video.year}</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-white/50 text-xs capitalize">
                      {video.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="max-w-screen-xl mx-auto px-6 mb-8">
        <div className="flex flex-wrap gap-3">
          {videoCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* All Videos Grid */}
      <section className="max-w-screen-xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-white mb-6">
          {selectedCategory === 'all' ? 'All Videos' : videoCategories.find(c => c.id === selectedCategory)?.label}
        </h2>

        {filteredVideos.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Film size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No videos in this category yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <div
                key={video.id}
                onClick={() => setCurrentVideo(video)}
                className="glass rounded-xl overflow-hidden hover:border-blue-500/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative bg-gradient-to-br from-slate-800 to-slate-900">
                  {getThumbnail(video) ? (
                    <img
                      src={getThumbnail(video)}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Film size={32} className="text-white/20" />
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Play size={20} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  {/* View count */}
                  {mounted && getViews(video.id) > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded flex items-center gap-1">
                      <Eye size={10} />
                      {getViews(video.id).toLocaleString()}
                    </div>
                  )}

                  {!video.youtubeId && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-500/80 text-white text-xs rounded">
                      SOON
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{video.title}</h3>
                  <p className="text-white/40 text-xs">{video.year}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* YouTube CTA */}
      <section className="max-w-screen-xl mx-auto px-6 mt-16">
        <div className="glass rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-500/20 rounded-xl">
              <Youtube size={32} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Subscribe on YouTube</h3>
              <p className="text-white/40">Get notified when new videos drop</p>
            </div>
          </div>
          <a
            href={youtubeChannel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Visit Channel
          </a>
        </div>
      </section>

      {/* Video Player Modal */}
      {currentVideo && (
        <VideoPlayer video={currentVideo} onClose={() => setCurrentVideo(null)} />
      )}
    </div>
  );
}
