/**
 * KICKBACK LOUNGE — Card Fan
 * Displays a hand of cards fanned out
 */

'use client';

import Card from './Card';

export default function CardFan({ cards = [], size = 'lg' }) {
  const count = cards.length;
  const maxSpread = 30; // max rotation degrees for outer cards
  const overlap = size === 'sm' ? -20 : size === 'md' ? -16 : -12; // negative margin for overlap

  return (
    <div className="flex items-end justify-center" style={{ perspective: '800px' }}>
      {cards.map((card, i) => {
        // Calculate rotation for fan effect
        const middleIndex = (count - 1) / 2;
        const rotation = count > 1
          ? ((i - middleIndex) / middleIndex) * maxSpread
          : 0;

        // Slight vertical offset for curve
        const yOffset = Math.abs(i - middleIndex) * (size === 'sm' ? 2 : 4);

        return (
          <div
            key={card.id || i}
            className="transition-transform duration-300 hover:-translate-y-3 hover:z-10 cursor-pointer"
            style={{
              transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
              marginLeft: i === 0 ? 0 : `${overlap}px`,
              zIndex: i,
            }}
          >
            <Card
              suit={card.suit}
              rank={card.rank}
              size={size}
            />
          </div>
        );
      })}
    </div>
  );
}
