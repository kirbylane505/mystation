'use client';
import { Play, Pause, SkipForward, Square, Radio } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useRadioStore } from '@/store/radioStore';

export default function RadioNowPlaying() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { activeStation, isRadioActive, skip, stop, queue, cursor } = useRadioStore();

  if (!isRadioActive || !currentTrack) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <Radio className="w-12 h-12 mx-auto mb-3 text-white/40" />
        <div className="text-white/60">Pick a station to start the radio.</div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[#FFD700]/30 bg-gradient-to-br from-[#1a1410] via-[#2a1a05] to-[#1a1410] shadow-[0_0_60px_rgba(255,215,0,0.15)] p-6">
      <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
        <Radio className="w-4 h-4" /> Now Playing · {activeStation?.name} Radio
      </div>
      <div className="text-3xl md:text-4xl font-black text-white truncate">{currentTrack.title}</div>
      <div className="text-white/60 truncate mb-6">{currentTrack.artist}</div>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] shadow-[0_0_40px_rgba(255,215,0,0.5)]"
        >
          {isPlaying ? <Pause className="w-9 h-9 fill-black text-black" /> : <Play className="w-9 h-9 fill-black text-black ml-1" />}
        </button>
        <button
          onClick={skip}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white"
        >
          <SkipForward className="w-7 h-7" />
        </button>
        <button
          onClick={stop}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400"
          aria-label="Stop station"
        >
          <Square className="w-6 h-6 fill-red-400" />
        </button>
      </div>
      <div className="text-xs text-white/40 mt-4">Track {cursor + 1} of {queue.length} in queue</div>
    </div>
  );
}
