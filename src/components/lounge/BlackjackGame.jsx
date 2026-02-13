/**
 * KICKBACK LOUNGE — Blackjack (21) Game UI
 * Dealer hand, player hand, hit/stand/double controls
 */

'use client';

import Card from './cards/Card';
import CardFan from './cards/CardFan';
import DeckStack from './cards/DeckStack';

export default function BlackjackGame({ gameState, myPlayerId, onMove }) {
  if (!gameState) return null;

  const isMyTurn = gameState.currentPlayerId === myPlayerId;
  const myStatus = gameState.playerStatus?.[myPlayerId]?.status || 'waiting';
  const isPlaying = gameState.phase === 'playing' && myStatus === 'playing';
  const canDouble = isPlaying && isMyTurn && gameState.myHand?.length === 2;

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Dealer Area */}
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Dealer</p>
        <div className="flex items-center justify-center gap-2">
          {gameState.dealerHand?.map((card, i) => (
            <Card
              key={card.id || i}
              suit={card.suit}
              rank={card.rank}
              faceDown={card.suit === 'hidden'}
              size="md"
            />
          ))}
        </div>
        {gameState.dealerValue && (
          <p className="text-white/60 text-sm mt-2 font-bold">{gameState.dealerValue}</p>
        )}
      </div>

      {/* Deck */}
      <DeckStack remaining={gameState.deckRemaining || 0} />

      {/* Other Players (mini hands) */}
      {Object.keys(gameState.otherHands || {}).length > 0 && (
        <div className="flex flex-wrap justify-center gap-6">
          {Object.entries(gameState.otherHands).map(([pid, hand]) => {
            const status = gameState.playerStatus?.[pid];
            return (
              <div key={pid} className="text-center">
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
                {hand.value && <p className="text-white/40 text-xs mt-1">{hand.value}</p>}
                <p className={`text-xs mt-0.5 ${
                  status?.status === 'busted' ? 'text-red-400' :
                  status?.status === 'blackjack' ? 'text-green-400' :
                  'text-white/20'
                }`}>
                  {status?.status}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* My Hand */}
      <div className="text-center">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Your Hand</p>
        <CardFan cards={gameState.myHand || []} />
        <p className={`text-lg font-black mt-3 ${
          gameState.myValue > 21 ? 'text-red-400' :
          gameState.myValue === 21 ? 'text-green-400' :
          'text-white'
        }`}>
          {gameState.myValue || 0}
        </p>

        {/* Status */}
        {myStatus === 'busted' && (
          <p className="text-red-400 font-bold text-sm mt-1">BUSTED!</p>
        )}
        {myStatus === 'blackjack' && (
          <p className="text-green-400 font-bold text-sm mt-1">BLACKJACK!</p>
        )}
        {myStatus === 'stood' && (
          <p className="text-white/40 text-sm mt-1">Standing</p>
        )}
      </div>

      {/* Controls */}
      {isPlaying && (
        <div className="flex items-center gap-3">
          {isMyTurn ? (
            <>
              <button
                onClick={() => onMove('hit')}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/20"
              >
                Hit
              </button>
              <button
                onClick={() => onMove('stand')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-lg transition"
              >
                Stand
              </button>
              {canDouble && (
                <button
                  onClick={() => onMove('double')}
                  className="px-8 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl font-bold text-lg transition"
                >
                  Double
                </button>
              )}
            </>
          ) : (
            <p className="text-white/30 text-sm">Waiting for other players...</p>
          )}
        </div>
      )}
    </div>
  );
}
