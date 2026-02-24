/**
 * KICKBACK LOUNGE — Tournament Bracket
 * Visual bracket with match cards, winner highlighting, current match pulse
 */

'use client';

import { Trophy, Swords, Clock, Check } from 'lucide-react';

function MatchCard({ match, onJoinMatch }) {
  const isPending = match.status === 'pending';
  const isPlaying = match.status === 'playing' || match.status === 'waiting';
  const isFinished = match.status === 'finished';
  const isBye = (match.player1 && !match.player2) || (!match.player1 && match.player2);

  return (
    <div
      className={`relative p-3 rounded-xl border transition-all ${
        isPlaying
          ? 'border-yellow-500/40 bg-yellow-500/5 animate-pulse'
          : isFinished
            ? 'border-green-500/20 bg-green-500/5'
            : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      {/* Match status badge */}
      <div className="absolute -top-2 left-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
          isPlaying ? 'bg-yellow-500/20 text-yellow-400' :
          isFinished ? 'bg-green-500/20 text-green-400' :
          'bg-white/10 text-white/40'
        }`}>
          {isPlaying ? 'LIVE' : isFinished ? 'DONE' : isBye ? 'BYE' : 'TBD'}
        </span>
      </div>

      {/* Players */}
      <div className="space-y-1.5 mt-1">
        <PlayerSlot
          player={match.player1}
          isWinner={match.winner === match.player1?.user_id}
          isFinished={isFinished}
        />
        <div className="text-center text-white/20 text-[10px]">VS</div>
        <PlayerSlot
          player={match.player2}
          isWinner={match.winner === match.player2?.user_id}
          isFinished={isFinished}
        />
      </div>

      {/* Join match button */}
      {isPlaying && match.roomCode && onJoinMatch && (
        <button
          onClick={() => onJoinMatch(match.roomCode)}
          className="mt-2 w-full text-xs px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition font-medium flex items-center justify-center gap-1"
        >
          <Swords size={10} />
          Join Match
        </button>
      )}
    </div>
  );
}

function PlayerSlot({ player, isWinner, isFinished }) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
        <div className="w-6 h-6 rounded-full bg-white/5" />
        <span className="text-xs text-white/20">TBD</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
      isWinner ? 'bg-green-500/10 ring-1 ring-green-500/30' :
      isFinished && !isWinner ? 'opacity-40' :
      'bg-white/[0.03]'
    }`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
        isWinner ? 'bg-green-500' : 'bg-white/10'
      }`}>
        {player.display_name?.charAt(0)?.toUpperCase() || 'P'}
      </div>
      <span className="text-xs text-white/80 truncate flex-1">{player.display_name}</span>
      {isWinner && <Trophy size={10} className="text-yellow-400 shrink-0" />}
    </div>
  );
}

export default function TournamentBracket({ bracket, onJoinMatch }) {
  if (!bracket || !bracket.matches || bracket.matches.length === 0) {
    return (
      <div className="text-center text-white/30 py-8">
        <Trophy size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Bracket not generated yet</p>
      </div>
    );
  }

  // Group matches by round
  const rounds = {};
  for (const match of bracket.matches) {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  }

  const roundNames = ['', 'Round 1', 'Quarterfinals', 'Semifinals', 'Finals'];

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {Object.entries(rounds).map(([round, matches]) => (
        <div key={round} className="flex flex-col gap-4 min-w-[200px]">
          <h4 className="text-xs text-white/40 font-semibold uppercase tracking-wider text-center">
            {roundNames[parseInt(round)] || `Round ${round}`}
          </h4>
          <div className="flex flex-col gap-4 justify-around flex-1">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onJoinMatch={onJoinMatch} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
