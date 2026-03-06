'use client';

import { moodPlaylists } from '@/data/moodPlaylists';
import { tracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';
import { Play } from 'lucide-react';

export default function MoodPlaylists() {
  const setQueue = usePlayerStore(s => s.setQueue);

  const playMood = (playlist) => {
    const moodTracks = playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter(Boolean);
    if (moodTracks.length > 0) {
      setQueue(moodTracks, 0);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-6">Mood Playlists</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {moodPlaylists.map(playlist => (
          <button
            key={playlist.id}
            onClick={() => playMood(playlist)}
            className={`relative flex-shrink-0 w-40 h-40 rounded-2xl bg-gradient-to-br ${playlist.gradient} p-4 flex flex-col justify-between group hover:scale-[1.03] transition-transform`}
          >
            <span className="text-3xl">{playlist.icon}</span>
            <div>
              <p className="text-sm font-bold text-white text-left">{playlist.title}</p>
              <p className="text-[10px] text-white/60 text-left">{playlist.description}</p>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Play size={14} className="text-white ml-0.5" fill="white" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
