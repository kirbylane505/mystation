'use client';

import { useState, useEffect } from 'react';

export default function DashboardAnalytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (email) {
      fetch(`/api/creators/analytics?email=${encodeURIComponent(decodeURIComponent(email))}`)
        .then((r) => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Plays', value: data.totalPlays, color: 'text-blue-400' },
    { label: 'Tracks', value: data.trackCount, color: 'text-purple-400' },
    { label: 'Followers', value: data.followerCount, color: 'text-green-400' },
    { label: 'Merch Items', value: data.merchCount, color: 'text-[#D4AF37]' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <p className="text-sm text-[#71717a]">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{(s.value || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Top Tracks</h2>
        {data.topTracks?.length > 0 ? (
          <div className="space-y-3">
            {data.topTracks.map((track, i) => (
              <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#09090b]">
                <span className="text-[#52525b] font-mono text-sm w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.title}</p>
                  <p className="text-xs text-[#71717a]">{track.artist}</p>
                </div>
                <span className="text-[#a1a1aa] text-sm">{(track.plays || 0).toLocaleString()} plays</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#71717a] text-sm">Upload tracks to see analytics here</p>
        )}
      </div>
    </div>
  );
}
