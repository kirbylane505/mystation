'use client';

import { Users, Clock, Radio, Play } from 'lucide-react';
import Link from 'next/link';

function formatDuration(startedAt) {
  if (!startedAt) return '';
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function formatReplayDuration(startedAt, endedAt) {
  if (!startedAt || !endedAt) return '';
  const diff = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function StreamCard({ stream, isReplay }) {
  const href = isReplay && stream.replay_url
    ? stream.replay_url
    : `/podstation/${stream.id}`;

  const CardWrapper = isReplay ? 'a' : Link;
  const extraProps = isReplay ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };

  return (
    <CardWrapper {...extraProps} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group-hover:scale-[1.02]">
        {stream.thumbnail_url ? (
          <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900/40 via-mystation-navy to-purple-900/30 flex items-center justify-center">
            {isReplay ? (
              <Play className="w-12 h-12 text-blue-400/50" />
            ) : (
              <Radio className="w-12 h-12 text-orange-500/50" />
            )}
          </div>
        )}

        {/* Badge: LIVE or REPLAY */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold text-white ${
          isReplay ? 'bg-blue-600' : 'bg-red-600'
        }`}>
          {isReplay ? (
            <>
              <Play className="w-2.5 h-2.5" />
              REPLAY
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
          <Users className="w-3 h-3" />
          {stream.viewer_count || 0}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded text-xs text-white">
          <Clock className="w-3 h-3" />
          {isReplay
            ? formatReplayDuration(stream.started_at, stream.ended_at)
            : formatDuration(stream.started_at)
          }
        </div>

        {stream.is_paid && (
          <div className="absolute bottom-3 left-3 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">
            ${stream.price}
          </div>
        )}
      </div>

      <div className="mt-2 px-1">
        <h3 className="text-white font-medium text-sm truncate">{stream.title}</h3>
        <p className="text-gray-400 text-xs truncate">{stream.user_name}</p>
      </div>
    </CardWrapper>
  );
}
