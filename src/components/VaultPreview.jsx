/**
 * MYSTATION - Vault Preview Component
 * Shows vault tracks - visible but locked until earned
 */

'use client';

import { useState, useEffect } from 'react';
import { Lock, Play, Crown, Flame, Music, Eye, Clock } from 'lucide-react';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { vaultTracks } from '@/data/vaultTracks';
import { usePlayerStore } from '@/store/playerStore';

export default function VaultPreview() {
  // ═══ VAULT HARD LOCKDOWN — COMPONENT DISABLED ═══
  return (
    <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-center">
      <Lock size={32} className="text-red-400/60 mx-auto mb-3" />
      <p className="text-white/30 text-sm font-medium">Vault Sealed</p>
      <p className="text-white/20 text-xs mt-1">No access available at this time</p>
    </div>
  );

  const [mounted, setMounted] = useState(false);
  const { currentStreak, isTop100, canAccessVault, getProgress } = useLoyaltyStore();
  const { setTrack, currentTrack, isPlaying } = usePlayerStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasAccess = canAccessVault();
  const progress = getProgress();
  const daysRemaining = Math.max(0, 90 - currentStreak);

  const handlePlay = (track) => {
    if (!hasAccess) return;
    setTrack(track);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden border border-yellow-500/20">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-b border-yellow-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Crown size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">THE VAULT</h2>
              <p className="text-white/50">Unreleased & Exclusive Tracks</p>
            </div>
          </div>

          {hasAccess ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
              <Crown size={16} className="text-green-400" />
              <span className="text-green-400 font-semibold text-sm">ACCESS GRANTED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
              <Lock size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold text-sm">LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Unlock Requirements */}
      {!hasAccess && (
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <p className="text-white/60 text-sm mb-2">Unlock Requirements:</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStreak >= 90 ? 'bg-green-500' : 'bg-white/10'}`}>
                    {currentStreak >= 90 ? '✓' : <Flame size={12} className="text-white/40" />}
                  </div>
                  <span className={currentStreak >= 90 ? 'text-green-400' : 'text-white/50'}>
                    90 Day Streak ({currentStreak}/90)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isTop100 ? 'bg-green-500' : 'bg-white/10'}`}>
                    {isTop100 ? '✓' : <Crown size={12} className="text-white/40" />}
                  </div>
                  <span className={isTop100 ? 'text-green-400' : 'text-white/50'}>
                    Top 100 Listener
                  </span>
                </div>
              </div>
            </div>
            {daysRemaining > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                <Clock size={16} className="text-white/40" />
                <span className="text-white/60 text-sm">{daysRemaining} days to go</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (currentStreak / 90) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Vault Tracks */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={16} className="text-white/40" />
          <span className="text-white/40 text-sm">
            {hasAccess ? 'Your exclusive tracks' : 'Preview what awaits you'}
          </span>
        </div>

        <div className="grid gap-3">
          {vaultTracks.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center gap-4 p-4 rounded-xl transition ${
                hasAccess
                  ? 'bg-white/5 hover:bg-white/10 cursor-pointer'
                  : 'bg-white/[0.02] opacity-60'
              } ${currentTrack?.id === track.id && isPlaying ? 'border border-yellow-500/30' : ''}`}
              onClick={() => handlePlay(track)}
            >
              {/* Track Number / Play Button */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                hasAccess
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                  : 'bg-white/10'
              }`}>
                {hasAccess ? (
                  currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex gap-0.5">
                      <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <Play size={16} className="text-white ml-0.5" fill="white" />
                  )
                ) : (
                  <Lock size={14} className="text-white/30" />
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${hasAccess ? 'text-white' : 'text-white/50'}`}>
                    {track.title}
                  </h4>
                  {track.isExclusive && (
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                      EXCLUSIVE
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-sm">
                  {track.featured ? `ft. ${track.featured}` : 'Mike Page'} • {track.year}
                </p>
              </div>

              {/* Duration */}
              <div className="text-white/30 text-sm font-mono">
                {track.duration || '3:45'}
              </div>

              {/* Blurred play count for locked state */}
              {!hasAccess && (
                <div className="text-white/20 text-sm blur-sm select-none">
                  {Math.floor(Math.random() * 500 + 100)} plays
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      {!hasAccess && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl border border-yellow-500/20 text-center">
            <p className="text-white/70 mb-2">
              Keep your streak alive! Listen to at least 1 track daily.
            </p>
            <p className="text-yellow-400 font-semibold">
              {daysRemaining} more days to unlock The Vault
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
