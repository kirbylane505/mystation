/**
 * KICKBACK LOUNGE — Spades Game UI
 * 2v2 trick-taking: bidding, card play, scores, AI partners
 */

'use client';

import { useState } from 'react';
import Card from './cards/Card';
import { SUIT_SYMBOLS } from '@/lib/games/constants';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

const SEAT_LABELS = ['South (You)', 'West', 'North (Partner)', 'East'];
const SEAT_POSITIONS = ['bottom', 'left', 'top', 'right'];

export default function SpadesGame({ gameState, myPlayerId, onMove }) {
  const { showGuide, closeGuide } = useAutoShowGuide('spades');
  const [selectedBid, setSelectedBid] = useState(3);

  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const myIdx = gameState.playerOrder.indexOf(myPlayerId);
  const myTeam = gameState.myTeam;
  const opponentTeam = myTeam === 'team1' ? 'team2' : 'team1';

  // Reorder players so "me" is at bottom (index 0 in display)
  const displayOrder = [0, 1, 2, 3].map(i => (myIdx + i) % 4);

  return (
    <div className="w-full flex flex-col items-center gap-4 relative">
      {showGuide && <HowToPlayModal gameId="spades" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="spades" className="absolute top-2 right-2 z-10" />
      {/* Scores */}
      <div className="flex items-center gap-8 mb-2">
        <div className={`text-center px-4 py-2 rounded-xl ${myTeam === 'team1' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10'}`}>
          <p className="text-white/50 text-xs uppercase">Your Team</p>
          <p className="text-white font-black text-2xl">{gameState.totalScores[myTeam]}</p>
          <p className="text-white/30 text-xs">{gameState.totalBags[myTeam]} bags</p>
        </div>
        <div className="text-center">
          <p className="text-white/30 text-xs">Round {gameState.round}</p>
          <p className="text-white/20 text-xs">{gameState.tricksPlayed}/13 tricks</p>
        </div>
        <div className={`text-center px-4 py-2 rounded-xl ${myTeam === 'team2' ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10'}`}>
          <p className="text-white/50 text-xs uppercase">Opponents</p>
          <p className="text-white font-black text-2xl">{gameState.totalScores[opponentTeam]}</p>
          <p className="text-white/30 text-xs">{gameState.totalBags[opponentTeam]} bags</p>
        </div>
      </div>

      {/* Bidding Phase */}
      {gameState.phase === 'bidding' && (
        <div className="text-center mb-4">
          <h3 className="text-white font-bold text-lg mb-3">Bidding Phase</h3>

          {/* Show placed bids */}
          <div className="flex items-center gap-4 mb-4">
            {displayOrder.map(seatIdx => {
              const pid = gameState.playerOrder[seatIdx];
              const bid = gameState.bids[pid];
              const isAI = gameState.aiPlayers?.includes(pid);
              const label = seatIdx === myIdx ? 'You' : isAI ? `AI ${SEAT_LABELS[displayOrder.indexOf(seatIdx)].split(' ')[0]}` : `P${seatIdx + 1}`;
              const isPartner = (seatIdx === (myIdx + 2) % 4);

              return (
                <div key={pid} className={`text-center px-3 py-2 rounded-lg ${isPartner ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-white/5 border border-white/10'}`}>
                  <p className="text-white/50 text-xs">{label}</p>
                  <p className="text-white font-bold">
                    {bid !== undefined ? (bid === 0 ? 'Nil' : bid) : '...'}
                  </p>
                </div>
              );
            })}
          </div>

          {isMyTurn && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBid(Math.max(0, selectedBid - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition font-bold"
                >
                  -
                </button>
                <span className="text-white font-black text-2xl w-10 text-center">
                  {selectedBid === 0 ? 'Nil' : selectedBid}
                </span>
                <button
                  onClick={() => setSelectedBid(Math.min(13, selectedBid + 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 text-white hover:bg-white/20 transition font-bold"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => onMove({ bid: selectedBid })}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/20"
              >
                Bid {selectedBid === 0 ? 'Nil' : selectedBid}
              </button>
              {selectedBid === 0 && (
                <p className="text-yellow-400/60 text-xs">Nil: +100 if you take 0 tricks, -100 if you don't</p>
              )}
            </div>
          )}

          {!isMyTurn && (
            <p className="text-white/30 text-sm">Waiting for {gameState.aiPlayers?.includes(gameState.currentPlayerId) ? 'AI' : 'opponent'} to bid...</p>
          )}
        </div>
      )}

      {/* Playing Phase — Trick Area */}
      {(gameState.phase === 'playing' || gameState.phase === 'finished') && (
        <>
          {/* Bids Display */}
          <div className="flex items-center gap-3 mb-2">
            {displayOrder.map(seatIdx => {
              const pid = gameState.playerOrder[seatIdx];
              const bid = gameState.bids[pid];
              const tricks = gameState.tricksWon[pid] || 0;
              const isAI = gameState.aiPlayers?.includes(pid);
              const isPartner = (seatIdx === (myIdx + 2) % 4);
              const label = seatIdx === myIdx ? 'You' : isAI ? 'AI' : `P${seatIdx + 1}`;

              return (
                <div key={pid} className={`text-center px-2 py-1 rounded-lg text-xs ${isPartner ? 'bg-blue-500/10' : 'bg-white/5'}`}>
                  <span className="text-white/40">{label}: </span>
                  <span className={`font-bold ${tricks >= (bid || 0) ? 'text-green-400' : 'text-white/70'}`}>
                    {tricks}/{bid === 0 ? 'Nil' : bid}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Trick Table */}
          <div className="relative w-64 h-48 mb-4">
            {/* Center trick area */}
            {gameState.currentTrick.map((play, i) => {
              const seatIdx = gameState.playerOrder.indexOf(play.playerId);
              const relativePos = (seatIdx - myIdx + 4) % 4;
              const positions = [
                { bottom: '0', left: '50%', transform: 'translateX(-50%)' },
                { top: '50%', left: '0', transform: 'translateY(-50%)' },
                { top: '0', left: '50%', transform: 'translateX(-50%)' },
                { top: '50%', right: '0', transform: 'translateY(-50%)' },
              ];

              return (
                <div key={i} className="absolute" style={positions[relativePos]}>
                  <Card suit={play.card.suit} rank={play.card.rank} size="sm" />
                </div>
              );
            })}

            {/* Empty trick area label */}
            {gameState.currentTrick.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/10 text-sm">
                  {gameState.trickLeader ? 'Lead a card' : 'Trick area'}
                </p>
              </div>
            )}
          </div>

          {/* Last trick winner */}
          {gameState.lastTrick && (
            <p className="text-white/30 text-xs mb-2">
              Last trick won by {gameState.lastTrick.winner === myPlayerId ? 'You' :
                gameState.aiPlayers?.includes(gameState.lastTrick.winner) ? 'AI' :
                  gameState.playerOrder.indexOf(gameState.lastTrick.winner) === (myIdx + 2) % 4 ? 'Partner' : 'Opponent'}
            </p>
          )}

          {/* Spades Broken indicator */}
          {gameState.spadesBroken && (
            <p className="text-blue-400/50 text-xs mb-1">{SUIT_SYMBOLS.spades} Spades broken</p>
          )}
        </>
      )}

      {/* My Hand */}
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Your Hand ({gameState.myHand?.length || 0} cards)</p>
        <div className="flex flex-wrap justify-center gap-1">
          {(gameState.myHand || []).map((card) => {
            const isValid = gameState.validPlays?.includes(card.id);
            const canPlay = gameState.phase === 'playing' && isMyTurn;

            return (
              <button
                key={card.id}
                onClick={() => canPlay && isValid && onMove({ cardId: card.id })}
                disabled={!canPlay || !isValid}
                className={`transition-all duration-150 ${
                  canPlay && isValid
                    ? 'hover:-translate-y-3 hover:shadow-xl cursor-pointer ring-2 ring-blue-400/50 rounded-lg'
                    : canPlay && !isValid
                    ? 'opacity-40 cursor-not-allowed'
                    : ''
                }`}
              >
                <Card suit={card.suit} rank={card.rank} size="sm" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Turn Indicator */}
      {gameState.phase === 'playing' && (
        <div className="mt-2">
          {isMyTurn ? (
            <p className="text-blue-400 font-bold text-sm animate-pulse">Your turn, play a card</p>
          ) : (
            <p className="text-white/30 text-sm">
              Waiting for {gameState.aiPlayers?.includes(gameState.currentPlayerId) ? 'AI' : 'opponent'}...
            </p>
          )}
        </div>
      )}

      {/* Other players' hand counts */}
      <div className="flex items-center gap-4 mt-2">
        {displayOrder.slice(1).map(seatIdx => {
          const pid = gameState.playerOrder[seatIdx];
          const count = gameState.otherHandCounts?.[pid] || 0;
          const isAI = gameState.aiPlayers?.includes(pid);
          const isPartner = (seatIdx === (myIdx + 2) % 4);

          return (
            <div key={pid} className="text-center">
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(count, 5) }).map((_, i) => (
                  <div key={i} className="w-3 h-4 rounded-sm bg-blue-600/40 border border-blue-500/20" />
                ))}
                {count > 5 && <span className="text-white/20 text-xs ml-1">+{count - 5}</span>}
              </div>
              <p className={`text-xs mt-1 ${isPartner ? 'text-blue-400/50' : 'text-white/30'}`}>
                {isPartner ? 'Partner' : isAI ? 'AI' : 'Opp'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
