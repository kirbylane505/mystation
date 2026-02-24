/**
 * KICKBACK LOUNGE — Game Selector Grid + Tournaments
 * 7-game grid with Tournaments tab
 */

'use client';

import { useState } from 'react';
import { GAME_TYPES } from '@/lib/games/constants';
import { Lock, Trophy, Gamepad2 } from 'lucide-react';
import TournamentList from './TournamentList';

const gameOrder = ['blackjack', 'slidesLadders', 'pool', 'spades', 'dominoes', 'quiz'];

export default function GameSelector({ onSelect, onJoinRoom }) {
  const [tab, setTab] = useState('games'); // games | tournaments

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('games')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === 'games'
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
        >
          <Gamepad2 size={16} />
          Games
        </button>
        <button
          onClick={() => setTab('tournaments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
            tab === 'tournaments'
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
        >
          <Trophy size={16} />
          Tournaments
        </button>
      </div>

      {tab === 'games' ? (
        <div className="grid grid-cols-2 gap-4">
          {gameOrder.map((key) => {
            const game = GAME_TYPES[key];
            return (
              <button
                key={key}
                data-testid={`game-card-${key}`}
                onClick={() => !game.comingSoon && onSelect(key)}
                disabled={game.comingSoon}
                className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 ${
                  game.comingSoon
                    ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-black/20 cursor-pointer hover:scale-[1.02]'
                }`}
              >
                {game.comingSoon && (
                  <div className="absolute top-3 right-3">
                    <Lock size={14} className="text-white/30" />
                  </div>
                )}

                <div className="text-4xl mb-3">{game.icon}</div>
                <h3 className="text-white font-bold text-lg mb-1">{game.name}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{game.description}</p>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-white/30">
                    {game.minPlayers === game.maxPlayers
                      ? `${game.minPlayers} players`
                      : `${game.minPlayers}-${game.maxPlayers} players`}
                  </span>
                  {game.comingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      Coming Soon
                    </span>
                  )}
                </div>

                {!game.comingSoon && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${game.color}15, transparent)`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <TournamentList onJoinMatch={onJoinRoom} />
      )}
    </div>
  );
}
