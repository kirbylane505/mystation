'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';

export default function TrackRedirect({ trackId, trackTitle }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to music page after a brief moment
    const timer = setTimeout(() => {
      router.replace(`/music?track=${trackId}`);
    }, 100);

    return () => clearTimeout(timer);
  }, [trackId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mystation-darker">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Music size={40} className="text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading {trackTitle}...</h1>
        <p className="text-white/50">Mike Page • MyStation</p>
      </div>
    </div>
  );
}
