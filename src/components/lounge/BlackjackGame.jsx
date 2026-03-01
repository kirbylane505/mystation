/**
 * KICKBACK LOUNGE — Blackjack (21) Game UI
 * Premium visual upgrade — casino felt, animations, polished badges
 * Multiplayer: dealer hand, player hand, hit/stand/double controls
 */

'use client';

import Card from './cards/Card';
import CardFan from './cards/CardFan';
import DeckStack from './cards/DeckStack';
import { Plus, Hand, Zap } from 'lucide-react';
import { HelpButton, useAutoShowGuide } from './HowToPlayModal';
import HowToPlayModal from './HowToPlayModal';

export default function BlackjackGame({ gameState, myPlayerId, onMove }) {
  const { showGuide, closeGuide } = useAutoShowGuide('blackjack');
  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const myStatus = gameState.playerStatus?.[myPlayerId]?.status || 'waiting';
  const isPlaying = gameState.phase === 'playing' && myStatus === 'playing';
  const canDouble = isPlaying && isMyTurn && gameState.myHand?.length === 2;
  const isFinished = gameState.phase === 'finished';
  const myResult = gameState.results?.[myPlayerId];

  return (
    <div
      className="w-full rounded-2xl overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at center, #1a5c2e 0%, #14532d 40%, #0c3b1e 80%, #052e16 100%)',
        border: '3px solid #1a3a28',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      {showGuide && <HowToPlayModal gameId="blackjack" isOpen={showGuide} onClose={closeGuide} />}
      <HelpButton gameId="blackjack" className="absolute top-2 right-2 z-10" />
      <div className="p-4 sm:p-6 flex flex-col items-center gap-6">
        {/* Dealer Area */}
        <div className="text-center w-full">
          <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-lg mb-3">
            <span className="text-emerald-300/70 text-xs font-bold uppercase tracking-widest">Dealer</span>
            {gameState.dealerValue != null && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-black ${
                gameState.dealerValue > 21 ? 'bg-red-500/30 text-red-300' :
                gameState.dealerValue === 21 ? 'bg-emerald-500/30 text-emerald-300' :
                'bg-white/10 text-white'
              }`}>
                {gameState.dealerValue}
              </span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            {gameState.dealerHand?.map((card, i) => (
              <div
                key={card.id || i}
                className="transition-all duration-500"
                style={{
                  animation: `dealSlide 0.4s ease-out ${i * 0.15}s both`,
                }}
              >
                <Card
                  suit={card.suit}
                  rank={card.rank}
                  faceDown={card.suit === 'hidden'}
                  size="md"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Deck */}
        <DeckStack remaining={gameState.deckRemaining || 0} />

        {/* Other Players (mini hands) */}
        {Object.keys(gameState.otherHands || {}).length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {Object.entries(gameState.otherHands).map(([pid, hand]) => {
              const status = gameState.playerStatus?.[pid];
              const isActive = gameState.currentPlayerId === pid;
              return (
                <div
                  key={pid}
                  className={`text-center p-2 rounded-xl transition-all ${
                    isActive ? 'ring-2 ring-emerald-400/50 bg-emerald-500/5' : ''
                  }`}
                >
                  <p className="text-white/30 text-xs mb-1 truncate max-w-[80px]">{pid.split('_')[1]}</p>
                  {hand.cards ? (
                    <div className="flex gap-1">
                      {hand.cards.map((c, i) => (
                        <Card key={i} suit={c.suit} rank={c.rank} size="sm" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {Array.from({ length: hand.cardCount || 2 }).map((_, i) => (
                        <Card key={i} faceDown size="sm" />
                      ))}
                    </div>
                  )}
                  {hand.value && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/60">
                      {hand.value}
                    </span>
                  )}
                  <p className={`text-xs mt-0.5 font-bold ${
                    status?.status === 'busted' ? 'text-red-400' :
                    status?.status === 'blackjack' ? 'text-emerald-400' :
                    status?.status === 'stood' ? 'text-white/40' :
                    'text-white/20'
                  }`}>
                    {status?.status === 'busted' ? 'BUST' :
                     status?.status === 'blackjack' ? 'BJ!' :
                     status?.status === 'stood' ? 'Stand' :
                     status?.status}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* My Hand */}
        <div className={`text-center w-full p-3 rounded-xl transition-all ${
          isMyTurn && isPlaying ? 'ring-2 ring-emerald-400/40 bg-emerald-500/5' : ''
        }`}>
          <div className="inline-flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-lg mb-3">
            <span className="text-emerald-300/70 text-xs font-bold uppercase tracking-widest">Your Hand</span>
          </div>
          <CardFan cards={gameState.myHand || []} />

          {/* Value Badge */}
          <div className="mt-3">
            <span className={`inline-block px-4 py-1 rounded-full text-lg font-black ${
              gameState.myValue > 21 ? 'bg-red-500/30 text-red-300' :
              gameState.myValue === 21 ? 'bg-emerald-500/30 text-emerald-300' :
              'bg-white/10 text-white'
            }`}>
              {gameState.myValue || 0}
            </span>
          </div>

          {/* Status Badges */}
          {myStatus === 'busted' && (
            <div className="mt-2 inline-block px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 animate-pulse">
              <span className="text-red-300 font-black text-sm">BUSTED!</span>
            </div>
          )}
          {myStatus === 'blackjack' && (
            <div className="mt-2 inline-block px-4 py-1.5 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30" style={{ animation: 'scaleGlow 0.5s ease-out' }}>
              <span className="text-yellow-300 font-black text-sm">BLACKJACK!</span>
            </div>
          )}
          {myStatus === 'stood' && (
            <p className="text-white/40 text-sm mt-2 font-bold">Standing</p>
          )}
        </div>

        {/* Result Flash */}
        {isFinished && myResult && (
          <div className={`w-full text-center py-3 rounded-xl font-black text-lg ${
            myResult.outcome === 'blackjack' ? 'bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-300' :
            myResult.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-300' :
            myResult.outcome === 'loss' ? 'bg-red-500/20 text-red-300' :
            'bg-white/10 text-white/70'
          }`} style={{ animation: 'scaleIn 0.3s ease-out' }}>
            {myResult.outcome === 'blackjack' ? 'BLACKJACK!' :
             myResult.outcome === 'win' ? 'YOU WIN!' :
             myResult.outcome === 'loss' ? 'YOU LOSE' :
             'PUSH'}
            <span className="block text-sm font-bold mt-0.5 opacity-70">{myResult.reason}</span>
          </div>
        )}

        {/* Controls */}
        {isPlaying && (
          <div className="flex items-center gap-3">
            {isMyTurn ? (
              <>
                <button
                  onClick={() => onMove('hit')}
                  className="px-8 py-3.5 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Hit
                </button>
                <button
                  onClick={() => onMove('stand')}
                  className="px-8 py-3.5 bg-gradient-to-b from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 text-white rounded-xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Hand size={18} />
                  Stand
                </button>
                {canDouble && (
                  <button
                    onClick={() => onMove('double')}
                    className="px-8 py-3.5 bg-gradient-to-b from-yellow-500/30 to-yellow-600/20 hover:from-yellow-500/40 hover:to-yellow-600/30 text-yellow-300 border border-yellow-500/30 rounded-xl font-black text-lg transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <Zap size={18} />
                    Double
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-white/40 text-sm">Waiting for other players...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes dealSlide {
          0% { opacity: 0; transform: translateX(60px) translateY(-30px) rotate(10deg); }
          100% { opacity: 1; transform: translateX(0) translateY(0) rotate(0deg); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes scaleGlow {
          0% { opacity: 0; transform: scale(0.5); box-shadow: 0 0 0 rgba(234,179,8,0); }
          50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(234,179,8,0.3); }
          100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 rgba(234,179,8,0); }
        }
      `}</style>
    </div>
  );
}
