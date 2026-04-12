'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Plus, Play } from 'lucide-react';
import Link from 'next/link';
import StreamCard from './StreamCard';

export default function PodStationLanding() {
  const router = useRouter();
  const [streams, setStreams] = useState([]);
  const [replays, setReplays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkLive() {
      try {
        const res = await fetch('/api/podstation/rooms');
        const data = await res.json();
        const liveStreams = data.streams || [];
        setStreams(liveStreams);
        setReplays(data.replays || []);

        // If exactly 1 stream is live, go straight to it
        if (liveStreams.length === 1) {
          router.replace(`/podstation/${liveStreams[0].id}`);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch streams:', err);
      } finally {
        setLoading(false);
        setChecked(true);
      }
    }
    checkLive();
  }, [router]);

  // Still checking — show loading
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Radio className="w-10 h-10 text-orange-500 animate-pulse" />
      </div>
    );
  }

  // Multiple streams live — show grid
  // No streams live — show empty state
  return (
    <div className="min-h-screen">
      <section className="relative py-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-mystation-navy to-mystation-black" />
        <div className="relative max-w-6xl mx-auto px-4">
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
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-20">
              <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No one&apos;s live right now</h2>
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

          {/* Replays section */}
          {replays.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-400" />
                Recent Replays
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {replays.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isReplay />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
