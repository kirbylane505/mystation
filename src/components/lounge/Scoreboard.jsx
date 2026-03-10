/**
 * KICKBACK LOUNGE — Scoreboard
 * Live score display during games
 */

'use client';

import { PLAYER_COLORS } from '@/lib/games/constants';

export default function Scoreboard({ players, gameState, gameType }) {
  if (!gameState) return null;

  return (
    <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4">
      <h3 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Scoreboard</h3>

      <div className="space-y-2">
        {players.map((player, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          let score = 0;
          let status = '';

          if (gameType === 'blackjack') {
            const ps = gameState.playerStatus?.[player.user_id];
            status = ps?.status || '';
            if (gameState.results?.[player.user_id]) {
              const result = gameState.results[player.user_id];
              status = result.outcome;
              score = result.payout || 0;
            }
          }

          return (
            <div key={player.user_id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-white/80 text-sm flex-1 truncate">
                {player.display_name}
              </span>
              {status && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  status === 'win' || status === 'Winner!' || status === 'blackjack'
                    ? 'bg-green-500/20 text-green-400'
                    : status === 'busted' || status === 'loss'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/5 text-white/50'
                }`}>
                  {status}
                </span>
              )}
              <span className="text-white font-bold text-sm tabular-nums">
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
