/**
 * KICKBACK LOUNGE — Playing Card Component
 * CSS-only playing card with flip animation
 */

'use client';

import { SUIT_SYMBOLS, SUIT_COLORS } from '@/lib/games/constants';

const sizeMap = {
  sm: { w: 'w-12', h: 'h-16', text: 'text-xs', symbol: 'text-sm' },
  md: { w: 'w-16', h: 'h-22', text: 'text-sm', symbol: 'text-lg' },
  lg: { w: 'w-20', h: 'h-28', text: 'text-base', symbol: 'text-xl' },
};

export default function Card({ suit, rank, faceDown = false, size = 'md', className = '' }) {
  const s = sizeMap[size] || sizeMap.md;
  const suitSymbol = SUIT_SYMBOLS[suit] || '';
  const suitColor = SUIT_COLORS[suit] || '#1e293b';
  const isRed = suit === 'hearts' || suit === 'diamonds';

  if (faceDown) {
    return (
      <div
        className={`${s.w} ${s.h} rounded-lg border border-white/20 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg ${className}`}
        style={{ minHeight: size === 'sm' ? 64 : size === 'md' ? 88 : 112 }}
      >
        <div className="w-3/4 h-3/4 rounded border border-white/10 bg-blue-500/20 flex items-center justify-center">
          <span className="text-white/20 font-bold text-xs">MS</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${s.w} ${s.h} rounded-lg border border-gray-200 bg-white flex flex-col justify-between p-1.5 shadow-lg hover:shadow-xl transition-shadow ${className}`}
      style={{ minHeight: size === 'sm' ? 64 : size === 'md' ? 88 : 112 }}
    >
      {/* Top left */}
      <div className="flex flex-col items-start leading-none">
        <span className={`${s.text} font-black`} style={{ color: suitColor }}>
          {rank}
        </span>
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>

      {/* Center */}
      <div className="flex items-center justify-center">
        <span className={`${s.symbol}`} style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>

      {/* Bottom right */}
      <div className="flex flex-col items-end leading-none rotate-180">
        <span className={`${s.text} font-black`} style={{ color: suitColor }}>
          {rank}
        </span>
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`} style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>
    </div>
  );
}
