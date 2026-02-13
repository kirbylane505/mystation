/**
 * KICKBACK LOUNGE — Stats & Leaderboards
 * Personal stats + global leaderboards per game
 */

'use client';

import { useState, useEffect } from 'react';
import { GAME_TYPES, GAME_POINTS } from '@/lib/games/constants';
import { Trophy, Flame, Star, TrendingUp, Medal, Gamepad2 } from 'lucide-react';

export default function StatsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedGame, setSelectedGame] = useState('blackjack');

  useEffect(() => {
    // Fetch leaderboard (placeholder for now)
    setLeaderboard([
      { rank: 1, name: 'ChampPlayer', wins: 24, rating: 1450, streak: 7, points: 2400 },
      { rank: 2, name: 'CardShark99', wins: 18, rating: 1380, streak: 5, points: 1850 },
      { rank: 3, name: 'LoungeKing', wins: 15, rating: 1320, streak: 3, points: 1500 },
      { rank: 4, name: 'DiceRoller', wins: 12, rating: 1260, streak: 4, points: 1200 },
      { rank: 5, name: 'NewChallenger', wins: 8, rating: 1180, streak: 2, points: 900 },
    ]);
  }, [selectedGame]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Trophy size={32} className="text-yellow-400" />
          Lounge Leaderboards
        </h1>
        <p className="text-white/50 mt-1">Rankings across all Kickback Lounge games</p>
      </div>

      {/* Game Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(GAME_TYPES)
          .filter(([_, g]) => !g.comingSoon)
          .map(([key, game]) => (
            <button
              key={key}
              onClick={() => setSelectedGame(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition ${
                selectedGame === key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/[0.03] text-white/50 hover:bg-white/[0.06]'
              }`}
            >
              <span>{game.icon}</span>
              <span className="text-sm font-medium">{game.name}</span>
            </button>
          ))}
      </div>

      {/* Points Reference */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Win', pts: GAME_POINTS.gameWin, icon: Trophy, color: 'text-yellow-400' },
          { label: 'Participation', pts: GAME_POINTS.gameLoss, icon: Gamepad2, color: 'text-white/50' },
          { label: '3-Win Streak', pts: GAME_POINTS.winStreak3, icon: Flame, color: 'text-orange-400' },
          { label: 'Perfect 21', pts: GAME_POINTS.perfectBlackjack, icon: Star, color: 'text-green-400' },
        ].map(({ label, pts, icon: Icon, color }) => (
          <div key={label} className="p-3 bg-white/[0.03] rounded-xl border border-white/10 text-center">
            <Icon size={16} className={`${color} mx-auto mb-1`} />
            <p className="text-white font-bold">+{pts}</p>
            <p className="text-white/30 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-white/[0.03] border-b border-white/5 text-white/40 text-xs font-semibold uppercase tracking-wider">
          <span>Rank</span>
          <span className="col-span-2">Player</span>
          <span className="text-center">Wins</span>
          <span className="text-center">Streak</span>
          <span className="text-right">Points</span>
        </div>

        {leaderboard.map((entry) => (
          <div
            key={entry.rank}
            className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.03] transition"
          >
            <span className="flex items-center">
              {entry.rank <= 3 ? (
                <Medal size={18} className={
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-gray-300' :
                  'text-amber-600'
                } />
              ) : (
                <span className="text-white/40 text-sm ml-0.5">{entry.rank}</span>
              )}
            </span>
            <span className="col-span-2 text-white font-medium">{entry.name}</span>
            <span className="text-center text-white/70">{entry.wins}</span>
            <span className="text-center">
              {entry.streak > 0 && (
                <span className="flex items-center justify-center gap-1 text-orange-400 text-sm">
                  <Flame size={12} /> {entry.streak}
                </span>
              )}
            </span>
            <span className="text-right text-white font-bold">{entry.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
