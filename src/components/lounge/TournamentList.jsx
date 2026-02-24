/**
 * KICKBACK LOUNGE — Tournament List
 * List of open/active tournaments with register + view bracket
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Play, Plus, ChevronRight, Loader2 } from 'lucide-react';
import { GAME_TYPES } from '@/lib/games/constants';
import { getPlayerId, getPlayerName } from '@/lib/playerId';
import TournamentBracket from './TournamentBracket';

export default function TournamentList({ onJoinMatch }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registration'); // registration | in_progress | finished
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createGame, setCreateGame] = useState('blackjack');
  const [createMax, setCreateMax] = useState(8);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lounge/tournament?status=${tab}`);
      const data = await res.json();
      setTournaments(data.tournaments || []);
    } catch {
      setTournaments([]);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const playerId = getPlayerId();
    const displayName = getPlayerName();

    const res = await fetch('/api/lounge/tournament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createName,
        gameType: createGame,
        maxPlayers: createMax,
        createdBy: playerId,
        displayName,
      }),
    });

    if (res.ok) {
      setShowCreate(false);
      setCreateName('');
      fetchTournaments();
    }
  };

  const handleJoin = async (tournamentId) => {
    const playerId = getPlayerId();
    const displayName = getPlayerName();

    const res = await fetch(`/api/lounge/tournament/${tournamentId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, displayName }),
    });

    if (res.ok) {
      fetchTournaments();
    }
  };

  const handleStart = async (tournamentId) => {
    const playerId = getPlayerId();

    const res = await fetch(`/api/lounge/tournament/${tournamentId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId }),
    });

    if (res.ok) {
      fetchTournaments();
    }
  };

  const viewBracket = async (tournamentId) => {
    const res = await fetch(`/api/lounge/tournament/${tournamentId}`);
    const data = await res.json();
    setSelectedTournament(data);
  };

  const playerId = typeof window !== 'undefined' ? getPlayerId() : null;

  return (
    <div className="space-y-4">
      {/* Bracket view */}
      {selectedTournament && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold">{selectedTournament.tournament?.name}</h3>
              <p className="text-white/40 text-sm">
                {selectedTournament.players?.length} players
              </p>
            </div>
            <button
              onClick={() => setSelectedTournament(null)}
              className="text-xs text-white/40 hover:text-white/60 px-3 py-1 rounded-lg bg-white/5"
            >
              Close
            </button>
          </div>
          <TournamentBracket
            bracket={selectedTournament.tournament?.bracket}
            onJoinMatch={onJoinMatch}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['registration', 'in_progress', 'finished'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedTournament(null); }}
            className={`text-xs px-3 py-1.5 rounded-lg transition ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t === 'registration' ? 'Open' : t === 'in_progress' ? 'Active' : 'Finished'}
          </button>
        ))}

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition flex items-center gap-1"
        >
          <Plus size={12} /> New Tournament
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white/[0.03] rounded-xl border border-white/10 p-4 space-y-3">
          <input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Tournament name..."
            maxLength={50}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-green-500/50"
          />
          <div className="flex gap-3">
            <select
              value={createGame}
              onChange={(e) => setCreateGame(e.target.value)}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
            >
              {Object.entries(GAME_TYPES).filter(([, g]) => !g.comingSoon).map(([key, game]) => (
                <option key={key} value={key}>{game.icon} {game.name}</option>
              ))}
            </select>
            <select
              value={createMax}
              onChange={(e) => setCreateMax(parseInt(e.target.value))}
              className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none"
            >
              {[4, 8, 16].map(n => (
                <option key={n} value={n}>{n} max</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={!createName.trim()}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg font-medium text-sm transition"
          >
            Create Tournament
          </button>
        </div>
      )}

      {/* Tournament cards */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 size={20} className="animate-spin text-white/30 mx-auto" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-8 text-white/30 text-sm">
          <Trophy size={24} className="mx-auto mb-2 opacity-40" />
          No {tab === 'registration' ? 'open' : tab === 'in_progress' ? 'active' : 'finished'} tournaments
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => {
            const isCreator = t.created_by === playerId;

            return (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/[0.06] transition"
              >
                <div className="text-3xl">{t.gameIcon}</div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{t.name}</h4>
                  <p className="text-white/40 text-xs">
                    {t.gameName} &middot; {t.playerCount}/{t.max_players} players
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tab === 'registration' && !isCreator && (
                    <button
                      onClick={() => handleJoin(t.id)}
                      className="text-xs px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition"
                    >
                      Join
                    </button>
                  )}

                  {tab === 'registration' && isCreator && t.playerCount >= 2 && (
                    <button
                      onClick={() => handleStart(t.id)}
                      className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition flex items-center gap-1"
                    >
                      <Play size={10} /> Start
                    </button>
                  )}

                  {(tab === 'in_progress' || tab === 'finished') && (
                    <button
                      onClick={() => viewBracket(t.id)}
                      className="text-xs px-3 py-1.5 bg-white/5 text-white/60 rounded-lg hover:bg-white/10 transition flex items-center gap-1"
                    >
                      Bracket <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
