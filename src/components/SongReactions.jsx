/**
 * MYSTATION - Song Reactions
 * Reaction buttons for tracks (fire, real, feels, classic)
 */

'use client';

import { useState } from 'react';
import { useEngagementStore, REACTIONS } from '@/store/engagementStore';

export default function SongReactions({ trackId, size = 'md' }) {
  const { trackReactions, addReaction } = useEngagementStore();
  const [showAll, setShowAll] = useState(false);
  const currentReaction = trackReactions[trackId];

  const sizeClasses = {
    sm: 'text-lg p-1.5',
    md: 'text-xl p-2',
    lg: 'text-2xl p-3',
  };

  const reactions = Object.values(REACTIONS);

  // Compact view - just show the selected reaction or first icon
  if (!showAll) {
    return (
      <button
        onClick={() => setShowAll(true)}
        className={`${sizeClasses[size]} bg-white/5 hover:bg-white/10 rounded-full transition flex items-center gap-1`}
      >
        <span>{currentReaction ? REACTIONS[currentReaction].emoji : '🔥'}</span>
        {currentReaction && (
          <span className="text-xs text-white/50 pr-1">{REACTIONS[currentReaction].label}</span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 animate-scale-in">
      {reactions.map(reaction => {
        const isSelected = currentReaction === reaction.id;
        return (
          <button
            key={reaction.id}
            onClick={() => {
              addReaction(trackId, reaction.id);
              setShowAll(false);
            }}
            className={`${sizeClasses[size]} rounded-full transition-all transform hover:scale-110 ${
              isSelected
                ? 'bg-blue-500/30 ring-2 ring-blue-400'
                : 'hover:bg-white/10'
            }`}
            title={reaction.label}
          >
            {reaction.emoji}
          </button>
        );
      })}
      <button
        onClick={() => setShowAll(false)}
        className="text-white/30 hover:text-white/60 px-2 text-sm"
      >
        ✕
      </button>
    </div>
  );
}

// Reaction summary for displaying aggregated reactions
export function ReactionSummary({ trackId, reactions = {} }) {
  // This would normally come from a backend
  const mockReactions = {
    fire: Math.floor(Math.random() * 50) + 10,
    real: Math.floor(Math.random() * 30) + 5,
    feels: Math.floor(Math.random() * 20) + 3,
    classic: Math.floor(Math.random() * 40) + 8,
  };

  const total = Object.values(mockReactions).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1">
        {Object.entries(mockReactions)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([type]) => (
            <span key={type} className="text-sm">
              {REACTIONS[type]?.emoji}
            </span>
          ))}
      </div>
      <span className="text-xs text-white/50">{total}</span>
    </div>
  );
}
