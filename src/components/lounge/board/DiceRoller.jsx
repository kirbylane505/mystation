/**
 * KICKBACK LOUNGE — Dice Roller
 * Animated dice roll display
 */

'use client';

const DICE_FACES = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export default function DiceRoller({ value, rolling, lastMove }) {
  const dots = value ? DICE_FACES[value] || [] : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-16 h-16 bg-white rounded-xl shadow-lg border border-gray-200 grid grid-cols-3 grid-rows-3 p-2 gap-0.5 transition-all ${
          rolling ? 'animate-bounce' : ''
        }`}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const hasDot = dots.some(([r, c]) => r === row && c === col);

          return (
            <div key={idx} className="flex items-center justify-center">
              {hasDot && (
                <div className="w-2.5 h-2.5 bg-gray-800 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {value && !rolling && (
        <span className="text-white/50 text-sm">
          Rolled a <span className="text-white font-bold">{value}</span>
        </span>
      )}
    </div>
  );
}
