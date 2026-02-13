/**
 * KICKBACK LOUNGE — Player Token
 * Colored game piece for board games
 */

'use client';

const sizeMap = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
};

export default function PlayerToken({ color, size = 'sm' }) {
  return (
    <div
      className={`${sizeMap[size] || sizeMap.sm} rounded-full shadow-md border-2 border-white/50`}
      style={{ backgroundColor: color }}
    />
  );
}
