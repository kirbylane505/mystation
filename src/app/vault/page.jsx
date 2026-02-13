/**
 * MYSTATION - The Vault
 * Private unreleased music storage - Owner access only
 * Updated: Feb 4, 2026 - 16 new vault tracks added
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Lock, Unlock, Play, Pause, Music, Upload, Trash2,
  Send, Eye, EyeOff, Shield, Clock, Calendar, Check, Star, Headphones
} from 'lucide-react';
import { vaultTracks as legacyVaultTracks } from '@/data/vaultTracks';
import { tracks } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';
import { useEngagementStore, calculatePoints, getVaultAccess } from '@/store/engagementStore';
import Link from 'next/link';

// Merge legacy vault + new tracks with albumId='vault'
const getDefaultTracks = () => {
  const newVaultTracks = tracks
    .filter(t => t.albumId === 'vault')
    .map(t => ({
      id: t.id,
      title: t.title + (t.featured ? ` ft. ${t.featured}` : ''),
      artist: 'Mike Page',
      producer: t.producer || 'The Cubist',
      audioUrl: t.audioFile,
      addedAt: '2026-02-04',
      status: 'vault',
      registered: false,
    }));
  return [...newVaultTracks, ...legacyVaultTracks];
};

// Vault PIN is now server-side only (env: VAULT_PIN)

// ═══════════════════════════════════════════════════════
// VAULT IS COMPLETELY LOCKED — NO ACCESS FOR ANYONE
// ═══════════════════════════════════════════════════════
const VAULT_LOCKED = true;

export default function VaultPage() {
  // HARD LOCKDOWN — return locked screen immediately
  if (VAULT_LOCKED) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-mystation-darker to-mystation-black" />
        <div className="relative text-center px-6 max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center">
            <Lock size={40} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Vault Locked</h1>
          <p className="text-white/40 text-sm mb-8">
            The Vault is currently sealed. No access available at this time.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white/60 rounded-xl hover:bg-white/15 transition font-medium"
          >
            Back to MyStation
          </Link>
        </div>
      </div>
    );
  }

  const [isUnlocked, setIsUnlockedState] = useState(false);
  const { setVaultUnlocked } = usePlayerStore();

  // Wrapper that sets both local state AND global store
  const setIsUnlocked = (val) => {
    setIsUnlockedState(val);
    setVaultUnlocked(val);
  };

  // Auto-verify vault session on mount (if cookie exists from earlier PIN entry)
  useEffect(() => {
    fetch('/api/vault/verify')
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsUnlockedState(true);
          setVaultUnlocked(true);
        }
      })
      .catch(() => {});
  }, [setVaultUnlocked]);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [vaultTracks, setVaultTracks] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: '', artist: 'Mike Page', producer: '', notes: '' });

  // Points-based access
  const engagementStats = useEngagementStore();
  const userPoints = calculatePoints(engagementStats);
  const vaultAccess = getVaultAccess(userPoints);
  const { vaultPicks, addVaultPick, removeVaultPick } = useEngagementStore();
  const isFanAccess = !isUnlocked && vaultAccess.level !== 'locked';
  const isFullFanAccess = vaultAccess.level === 'full';
  const canPickMore = vaultPicks.length < vaultAccess.picks;

  // Use global player
  const { currentTrack, isPlaying, setQueue, togglePlay } = usePlayerStore();

  // Load vault tracks - merge default tracks with localStorage
  useEffect(() => {
    const defaultTracks = getDefaultTracks();
    const saved = localStorage.getItem('mystation_vault');
    if (saved) {
      const savedTracks = JSON.parse(saved);
      // Merge: default tracks + any new uploaded tracks
      const mergedTracks = [...defaultTracks];
      savedTracks.forEach(track => {
        if (!mergedTracks.find(t => t.id === track.id)) {
          mergedTracks.push(track);
        }
      });
      setVaultTracks(mergedTracks);
    } else {
      setVaultTracks(defaultTracks);
    }
  }, []);

  // Save vault tracks to localStorage
  useEffect(() => {
    if (vaultTracks.length > 0) {
      localStorage.setItem('mystation_vault', JSON.stringify(vaultTracks));
    }
  }, [vaultTracks]);

  const [pinLoading, setPinLoading] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError(false);
    setPinMessage('');

    try {
      const res = await fetch('/api/vault/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();

      if (data.success) {
        setIsUnlocked(true);
        setPinError(false);
      } else {
        setPinError(true);
        setPinMessage(data.error || 'Wrong PIN');
        setPinInput('');
      }
    } catch {
      setPinError(true);
      setPinMessage('Connection error. Try again.');
      setPinInput('');
    } finally {
      setPinLoading(false);
    }
  };

  // Play track using global player
  const playTrack = (track) => {
    // Ensure vault is unlocked in global store before playing
    setVaultUnlocked(true);

    const trackIndex = vaultTracks.findIndex(t => t.id === track.id);
    const allPlayerTracks = vaultTracks.map(t => ({
      id: `vault-${t.id}`,
      title: t.title,
      album: 'Vault',
      albumId: 'vault',
      audioFile: t.audioUrl,
      producer: t.producer,
      featured: null,
    }));
    setQueue(allPlayerTracks, trackIndex >= 0 ? trackIndex : 0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const audioUrl = URL.createObjectURL(file);
      const track = {
        id: Date.now(),
        title: newTrack.title || file.name.replace(/\.[^/.]+$/, ''),
        artist: newTrack.artist || 'Mike Page',
        producer: newTrack.producer,
        notes: newTrack.notes,
        audioUrl,
        fileName: file.name,
        addedAt: new Date().toISOString(),
        status: 'vault', // vault | released
        registered: false,
      };
      setVaultTracks([track, ...vaultTracks]);
      setNewTrack({ title: '', artist: 'Mike Page', producer: '', notes: '' });
      setShowUpload(false);
    }
  };

  const deleteTrack = (trackId) => {
    if (confirm('Delete this track from the vault?')) {
      setVaultTracks(vaultTracks.filter(t => t.id !== trackId));
    }
  };

  const releaseTrack = (track) => {
    if (confirm(`Release "${track.title}" to the public catalog?`)) {
      setVaultTracks(vaultTracks.map(t =>
        t.id === track.id ? { ...t, status: 'released', releasedAt: new Date().toISOString() } : t
      ));
    }
  };

  const markRegistered = (trackId) => {
    setVaultTracks(vaultTracks.map(t =>
      t.id === trackId ? { ...t, registered: true, registeredAt: new Date().toISOString() } : t
    ));
  };

  // Lock Screen — show if no PIN access AND no points access
  if (!isUnlocked && !isFanAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="bg-orb w-[400px] h-[400px] bg-red-600 top-[-100px] left-[-100px] opacity-30" />
        <div className="bg-orb w-[300px] h-[300px] bg-purple-600 bottom-[-50px] right-[-50px] opacity-30" />

        <div className="relative glass rounded-3xl p-10 max-w-md w-full mx-4 border border-red-500/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30">
              <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2">THE VAULT</h1>
            <p className="text-white/50">Exclusive Unreleased Music</p>
          </div>

          {/* Points Progress to Vault */}
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Headphones size={16} className="text-purple-400" />
              <h3 className="text-white font-bold text-sm">Earn Access by Streaming</h3>
            </div>
            <p className="text-white/50 text-sm mb-3">
              Listen to music and earn points to unlock the Vault. You have <span className="text-purple-400 font-bold">{userPoints.toLocaleString()} pts</span>.
            </p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min((userPoints / 300) * 100, 100)}%` }} />
            </div>
            <p className="text-purple-400 text-xs font-medium">{Math.max(300 - userPoints, 0)} pts to Vault Preview (pick 3 songs)</p>
            <Link href="/rewards" className="mt-3 flex items-center justify-center gap-2 py-2 bg-purple-500/20 rounded-lg text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition">
              <Star size={14} /> View Rewards Progress
            </Link>
          </div>

          {/* Owner PIN */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <Shield size={16} className="text-red-400" />
              Owner Access
            </h3>
            <p className="text-white/60 text-sm mb-3">Full management access with PIN.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                maxLength={4}
                className={`w-full px-6 py-3 bg-white/5 border ${pinError ? 'border-red-500' : 'border-white/10'} rounded-xl text-white text-center text-xl tracking-[1em] placeholder-white/20 focus:outline-none focus:border-red-500 transition`}
              />
              {pinError && (
                <p className="text-red-400 text-sm mt-2 text-center">{pinMessage || 'Wrong PIN. Try again.'}</p>
              )}
              <button
                type="submit"
                disabled={pinLoading}
                className="w-full mt-3 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Unlock size={18} />
                {pinLoading ? 'Verifying...' : 'Unlock'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Fan Access Vault (points-based, listen only)
  if (isFanAccess && !isUnlocked) {
    const accessibleTracks = isFullFanAccess
      ? vaultTracks
      : vaultTracks.filter(t => vaultPicks.includes(t.id));
    const canPlay = (trackId) => isFullFanAccess || vaultPicks.includes(trackId);

    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="bg-orb w-[500px] h-[500px] bg-purple-600 top-[-200px] right-[-100px] opacity-20" />

        <div className="relative max-w-screen-xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Headphones size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">THE VAULT</h1>
                <p className="text-purple-400 text-sm font-medium">
                  {isFullFanAccess ? 'Full Access — Stream Everything' : `Pick ${vaultAccess.picks - vaultPicks.length} more song${vaultAccess.picks - vaultPicks.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                <span className="text-purple-400 font-bold text-sm">{userPoints.toLocaleString()} pts</span>
              </div>
              {!isFullFanAccess && (
                <Link href="/rewards" className="px-4 py-2 bg-white/10 text-white/60 text-sm font-medium rounded-xl hover:bg-white/20 transition">
                  Earn More Points
                </Link>
              )}
            </div>
          </div>

          {/* Pick Banner (only for 300pt tier) */}
          {!isFullFanAccess && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star size={20} className="text-purple-400" />
                <div>
                  <p className="text-white font-bold text-sm">Vault Preview Mode</p>
                  <p className="text-white/40 text-xs">Select {vaultAccess.picks} songs to stream. Earn {(12345 - userPoints).toLocaleString()} more points for full access.</p>
                </div>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: vaultAccess.picks }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < vaultPicks.length ? 'bg-purple-400' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>
          )}

          {/* Track List */}
          <div className="glass rounded-2xl overflow-hidden mb-32">
            <div className="p-4 border-b border-white/10 flex items-center gap-4">
              <Music size={20} className="text-purple-400" />
              <span className="text-white font-medium">
                {isFullFanAccess ? 'All Vault Tracks' : 'Choose Your Songs'}
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {vaultTracks.map((track) => {
                const isPicked = vaultPicks.includes(track.id);
                const isPlayable = canPlay(track.id);
                const isCurrentTrack = currentTrack?.id === `vault-${track.id}`;

                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-4 p-4 transition ${
                      isPlayable ? 'hover:bg-white/5 cursor-pointer' : 'opacity-50'
                    } ${isCurrentTrack ? 'bg-purple-500/10' : ''}`}
                    onClick={() => {
                      if (isPlayable) {
                        if (isCurrentTrack && isPlaying) {
                          togglePlay();
                        } else {
                          // Set vault unlocked for playback
                          setVaultUnlocked(true);
                          const playableTracks = isFullFanAccess
                            ? vaultTracks
                            : vaultTracks.filter(t => vaultPicks.includes(t.id));
                          const trackIndex = playableTracks.findIndex(t => t.id === track.id);
                          const allPlayerTracks = playableTracks.map(t => ({
                            id: `vault-${t.id}`,
                            title: t.title + (t.featured ? ` ft. ${t.featured}` : ''),
                            album: 'Vault',
                            albumId: 'vault',
                            audioFile: t.audioUrl,
                            producer: t.producer,
                            featured: null,
                          }));
                          setQueue(allPlayerTracks, trackIndex >= 0 ? trackIndex : 0);
                        }
                      }
                    }}
                  >
                    {/* Pick / Play Button */}
                    {isFullFanAccess || isPicked ? (
                      <button className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                        isCurrentTrack && isPlaying
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-purple-500 hover:text-white'
                      }`}>
                        {isCurrentTrack && isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canPickMore) addVaultPick(track.id);
                        }}
                        disabled={!canPickMore}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition ${
                          canPickMore
                            ? 'border-purple-500/50 text-purple-400 hover:bg-purple-500/20'
                            : 'border-white/10 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Check size={20} />
                      </button>
                    )}

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium">{track.title}</h3>
                      <p className="text-white/40 text-sm">
                        {track.artist} {track.producer && `\u2022 Prod. ${track.producer}`}
                      </p>
                    </div>

                    {/* Status */}
                    {isPicked && !isFullFanAccess && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVaultPick(track.id);
                        }}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full hover:bg-red-500/20 hover:text-red-400 transition"
                      >
                        Selected
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Owner Vault Interface (PIN access — full management)
  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-black to-black" />
      <div className="bg-orb w-[500px] h-[500px] bg-red-600 top-[-200px] right-[-100px] opacity-20" />

      <div className="relative max-w-screen-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">THE VAULT</h1>
              <p className="text-white/50">{vaultTracks.length} unreleased tracks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition flex items-center gap-2"
            >
              <Upload size={18} />
              Add Track
            </button>
            <button
              onClick={() => setIsUnlocked(false)}
              className="px-5 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition flex items-center gap-2"
            >
              <Lock size={18} />
              Lock
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'In Vault', value: vaultTracks.filter(t => t.status === 'vault').length, color: 'red' },
            { label: 'Released', value: vaultTracks.filter(t => t.status === 'released').length, color: 'green' },
            { label: 'Registered', value: vaultTracks.filter(t => t.registered).length, color: 'blue' },
            { label: 'Unregistered', value: vaultTracks.filter(t => !t.registered).length, color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="glass rounded-xl p-5 text-center">
              <p className={`text-3xl font-black text-${stat.color}-400`}>{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Track List */}
        <div className="glass rounded-2xl overflow-hidden mb-32">
          <div className="p-4 border-b border-white/10 flex items-center gap-4">
            <Music size={20} className="text-red-400" />
            <span className="text-white font-medium">Vault Tracks</span>
          </div>

          {vaultTracks.length === 0 ? (
            <div className="p-20 text-center">
              <Music size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No tracks in the vault yet</p>
              <p className="text-white/30 text-sm">Click "Add Track" to upload your first unreleased song</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {vaultTracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === `vault-${track.id}`;
                return (
                <div
                  key={track.id}
                  onClick={() => isCurrentTrack && isPlaying ? togglePlay() : playTrack(track)}
                  className={`flex items-center gap-4 p-4 hover:bg-white/5 transition cursor-pointer ${isCurrentTrack ? 'bg-red-500/10' : ''}`}
                >
                  {/* Play Button */}
                  <button
                    onClick={() => isCurrentTrack && isPlaying ? togglePlay() : playTrack(track)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
                      isCurrentTrack && isPlaying
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    {isCurrentTrack && isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                  </button>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium ">{track.title}</h3>
                      {track.registered && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">Registered</span>
                      )}
                      {track.status === 'released' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">Released</span>
                      )}
                    </div>
                    <p className="text-white/40 text-sm ">
                      {track.artist} {track.producer && `• Prod. ${track.producer}`}
                    </p>
                  </div>

                  {/* Added Date */}
                  <div className="text-white/30 text-sm hidden md:block">
                    <Clock size={14} className="inline mr-1" />
                    {new Date(track.addedAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!track.registered && (
                      <button
                        onClick={() => markRegistered(track.id)}
                        className="px-3 py-2 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 transition"
                      >
                        Mark Registered
                      </button>
                    )}
                    {track.status === 'vault' && (
                      <button
                        onClick={() => releaseTrack(track)}
                        className="px-3 py-2 bg-green-500/10 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/20 transition flex items-center gap-1"
                      >
                        <Send size={12} />
                        Release
                      </button>
                    )}
                    <button
                      onClick={() => deleteTrack(track.id)}
                      className="p-2 text-white/30 hover:text-red-400 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>


        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
            <div className="glass rounded-3xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black text-white mb-6">Add to Vault</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Song Title</label>
                  <input
                    type="text"
                    value={newTrack.title}
                    onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                    placeholder="Enter song title"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Artist</label>
                  <input
                    type="text"
                    value={newTrack.artist}
                    onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                    placeholder="Mike Page"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Producer</label>
                  <input
                    type="text"
                    value={newTrack.producer}
                    onChange={(e) => setNewTrack({ ...newTrack, producer: e.target.value })}
                    placeholder="The Cubist"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Notes</label>
                  <textarea
                    value={newTrack.notes}
                    onChange={(e) => setNewTrack({ ...newTrack, notes: e.target.value })}
                    placeholder="Writers, features, release plans..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>
              </div>

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-red-500/50 transition">
                  <Upload size={32} className="text-white/40 mx-auto mb-3" />
                  <p className="text-white/60 mb-1">Click to upload audio file</p>
                  <p className="text-white/30 text-sm">MP3, WAV, M4A supported</p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowUpload(false)}
                className="w-full mt-4 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
