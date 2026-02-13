/**
 * KICKBACK LOUNGE — Deck Stack
 * Visual deck pile showing remaining cards
 */

'use client';

export default function DeckStack({ remaining = 0 }) {
  // Show 1-4 stacked cards based on remaining
  const stackCount = remaining > 30 ? 4 : remaining > 20 ? 3 : remaining > 10 ? 2 : 1;

  return (
    <div className="relative w-16 h-22 flex items-center justify-center">
      {Array.from({ length: stackCount }).map((_, i) => (
        <div
          key={i}
          className="absolute w-16 rounded-lg border border-white/20 bg-gradient-to-br from-blue-600 to-blue-800 shadow-md"
          style={{
            height: 88,
            top: -i * 2,
            left: i * 1,
            zIndex: stackCount - i,
          }}
        />
      ))}
      <span className="relative z-10 text-white/40 text-xs font-medium">
        {remaining}
      </span>
    </div>
  );
}
