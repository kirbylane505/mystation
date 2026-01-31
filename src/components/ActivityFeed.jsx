/**
 * MYSTATION - Live Activity Feed
 * Real-time display of plays, donations, and trending tracks
 */

'use client';

import { useEffect, useState } from 'react';
import { useEngagementStore, REACTIONS } from '@/store/engagementStore';
import { tracks } from '@/data/tracks';
import { Music, Heart, Flame, TrendingUp, Zap } from 'lucide-react';

export default function ActivityFeed({ limit = 10, showTrending = true }) {
  const { activityFeed, generateFakeActivity } = useEngagementStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Generate fake activity periodically for demo
    const interval = setInterval(() => {
      generateFakeActivity();
    }, 5000 + Math.random() * 10000); // Random 5-15 seconds

    // Generate a few initial activities
    for (let i = 0; i < 5; i++) {
      setTimeout(() => generateFakeActivity(), i * 500);
    }

    return () => clearInterval(interval);
  }, [generateFakeActivity]);

  const getActivityMessage = (activity) => {
    const track = tracks.find(t => t.id === activity.data || t.id === activity.data?.trackId);

    switch (activity.type) {
      case 'play':
        return {
          icon: <Music size={16} className="text-blue-400" />,
          message: (
            <>
              Someone in <span className="text-blue-400 font-medium">{activity.city}</span> just played{' '}
              <span className="text-white font-medium">"{track?.title || 'a track'}"</span>
            </>
          ),
          color: 'from-blue-500/20 to-blue-600/10'
        };

      case 'donation':
        return {
          icon: <Heart size={16} className="text-pink-400" fill="currentColor" />,
          message: (
            <>
              <span className="text-pink-400 font-bold">${activity.data}</span> donated to the Foundation from{' '}
              <span className="text-white font-medium">{activity.city}</span>
            </>
          ),
          color: 'from-pink-500/20 to-pink-600/10'
        };

      case 'reaction':
        const reaction = REACTIONS[activity.data?.reaction];
        return {
          icon: <span className="text-lg">{reaction?.emoji || '🔥'}</span>,
          message: (
            <>
              Someone reacted <span className="text-yellow-400">{reaction?.emoji}</span> to{' '}
              <span className="text-white font-medium">"{track?.title || 'a track'}"</span>
            </>
          ),
          color: 'from-yellow-500/20 to-orange-600/10'
        };

      default:
        return null;
    }
  };

  // Calculate trending tracks (most played in feed)
  const getTrendingTracks = () => {
    const playCounts = {};
    activityFeed
      .filter(a => a.type === 'play')
      .forEach(a => {
        const trackId = a.data;
        playCounts[trackId] = (playCounts[trackId] || 0) + 1;
      });

    return Object.entries(playCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trackId, count]) => ({
        track: tracks.find(t => t.id === parseInt(trackId)),
        count
      }))
      .filter(t => t.track);
  };

  if (!mounted) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3" />
          <div className="h-12 bg-white/10 rounded" />
          <div className="h-12 bg-white/10 rounded" />
          <div className="h-12 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const trending = getTrendingTracks();

  return (
    <div className="space-y-6">
      {/* Trending Section */}
      {showTrending && trending.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-green-400" />
            <h3 className="text-lg font-bold text-white">Trending Now</h3>
          </div>
          <div className="space-y-3">
            {trending.map(({ track, count }, i) => (
              <div
                key={track.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500/10 to-transparent rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-green-400">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-white">{track.title}</p>
                    <p className="text-sm text-white/50">{track.album}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Flame size={16} />
                  <span className="font-bold">{count} plays</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Activity Feed */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Zap size={20} className="text-yellow-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">Live Activity</h3>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
            LIVE
          </span>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activityFeed.slice(0, limit).map((activity, i) => {
            const activityData = getActivityMessage(activity);
            if (!activityData) return null;

            return (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 bg-gradient-to-r ${activityData.color} rounded-xl animate-fade-in border border-white/5`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  {activityData.icon}
                </div>
                <p className="text-sm text-white/70 flex-1">
                  {activityData.message}
                </p>
                <span className="text-xs text-white/30">
                  {getTimeAgo(activity.timestamp)}
                </span>
              </div>
            );
          })}

          {activityFeed.length === 0 && (
            <p className="text-center text-white/30 py-8">
              Activity will appear here as fans listen...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
