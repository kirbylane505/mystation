'use client';

import { useEffect, useState } from 'react';
import { Radio, Plus } from 'lucide-react';
import Link from 'next/link';
import StreamCard from './StreamCard';

export default function PodStationGrid() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStreams() {
    try {
      const res = await fetch('/api/podstation/rooms');
      const data = await res.json();
      setStreams(data.streams || []);
    } catch (err) {
      console.error('Failed to fetch streams:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-orange-500" />
            PodStation
          </h1>
          <p className="text-gray-400 text-sm mt-1">Live streams from the MyStation community</p>
        </div>
        <Link
          href="/podstation/go-live"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Go Live
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No one&apos;s live yet</h2>
          <p className="text-gray-400 mb-6">Be the first to go live on PodStation</p>
          <Link
            href="/podstation/go-live"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Start Streaming
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}
