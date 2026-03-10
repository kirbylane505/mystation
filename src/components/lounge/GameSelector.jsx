/**
 * KICKBACK LOUNGE — Game Selector Grid + Tournaments
 * 7-game grid with Tournaments tab
 */

'use client';

import { useState } from 'react';
import { GAME_TYPES } from '@/lib/games/constants';
import { Lock, Trophy, Gamepad2 } from 'lucide-react';
import TournamentList from './TournamentList';

const gameOrder = ['blackjack', 'pool', 'spades', 'dominoes', 'quiz', 'galaga'];

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
          {gameOrder.map((key, idx) => {
            const game = GAME_TYPES[key];
            return (
              <button
                key={key}
                data-testid={`game-card-${key}`}
                onClick={() => !game.comingSoon && onSelect(key)}
                disabled={game.comingSoon}
                className={`relative group p-6 rounded-2xl text-left transition-all duration-500 ${
                  game.comingSoon
                    ? 'border border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                    : 'border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer hover:-translate-y-1.5'
                }`}
                style={{ animation: `loungeFadeUp 0.4s ease-out ${idx * 0.08}s both` }}
              >
                {/* Hover glow border */}
                {!game.comingSoon && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 0 1px ${game.color}30, 0 8px 40px ${game.color}12`,
                    }}
                  />
                )}

                {game.comingSoon && (
                  <div className="absolute top-3 right-3">
                    <Lock size={14} className="text-white/30" />
                  </div>
                )}

                {/* Animated icon with glow */}
                <div
                  className="text-4xl mb-3 transition-all duration-500 group-hover:scale-110 inline-block"
                  style={!game.comingSoon ? { filter: `drop-shadow(0 0 0px transparent)` } : {}}
                >
                  <span className="group-hover:drop-shadow-lg transition-all duration-500">{game.icon}</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1 transition-colors group-hover:text-white">{game.name}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{game.description}</p>

                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-white/20 bg-white/[0.04] px-2.5 py-1 rounded-full">
                    {game.minPlayers === game.maxPlayers
                      ? `${game.minPlayers} players`
                      : `${game.minPlayers}–${game.maxPlayers} players`}
                  </span>
                  {game.comingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Background gradient on hover */}
                {!game.comingSoon && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${game.color}10, transparent 60%)`,
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
