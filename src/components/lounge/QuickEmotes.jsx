/**
 * KICKBACK LOUNGE — Quick Emotes
 * Row of emoji reaction buttons
 */

'use client';

import { EMOTES } from '@/lib/games/constants';

export default function QuickEmotes({ onEmote }) {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-t border-white/5">
      {EMOTES.map((emote) => (
        <button
          key={emote.id}
          onClick={() => onEmote(emote.id)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition text-lg"
          title={emote.label}
        >
          {emote.emoji}
        </button>
      ))}
    </div>
  );
}
