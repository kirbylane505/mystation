'use client';
import Image from 'next/image';
import { Play } from 'lucide-react';

export default function RadioStationTile({ station, active, onPlay }) {
  return (
    <button
      onClick={() => onPlay(station)}
      className={`group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all min-w-[130px] ${
        active
          ? 'bg-[#FFD700]/10 border border-[#FFD700]/40'
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-black/40">
        {station.avatar && (
          <Image
            src={station.avatar}
            alt={station.name}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-10 h-10 fill-white text-white" />
        </div>
      </div>
      <div className="text-sm font-bold text-white text-center truncate max-w-[110px]">
        {station.name}
      </div>
      <div className="text-xs text-white/50">{station.trackCount} tracks</div>
    </button>
  );
}
