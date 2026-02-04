/**
 * MYSTATION - Create Playlist Modal
 * Users can create custom playlists with any tracks
 */

'use client';

import { useState } from 'react';
import { X, Plus, Check, Music, Search } from 'lucide-react';

const EMOJI_OPTIONS = ['🎧', '🎵', '🔥', '💜', '🎤', '🎹', '🎸', '💎', '⭐', '🌙', '🚀', '💫'];

export default function CreatePlaylistModal({ onClose, onCreate, availableTracks }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎧');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [step, setStep] = useState(1); // 1: details, 2: select tracks

  const filteredTracks = availableTracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleTrack = (trackId) => {
    if (selectedTracks.includes(trackId)) {
      setSelectedTracks(selectedTracks.filter(id => id !== trackId));
    } else {
      setSelectedTracks([...selectedTracks, trackId]);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreate({
      name: name.trim(),
      description: description.trim(),
      emoji: selectedEmoji,
      trackIds: selectedTracks,
      coverGradient: 'from-purple-500/30 to-pink-500/30',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-mystation-navy border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {step === 1 ? 'Create Playlist' : 'Add Tracks'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            /* Step 1: Playlist Details */
            <div className="space-y-6">
              {/* Emoji Picker */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Choose an icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition ${
                        selectedEmoji === emoji
                          ? 'bg-blue-500 ring-2 ring-blue-400'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Playlist name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Playlist"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this playlist about?"
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* Step 2: Select Tracks */
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tracks..."
                  className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Selected count */}
              <p className="text-white/60 text-sm">
                {selectedTracks.length} tracks selected
              </p>

              {/* Track List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredTracks.map(track => {
                  const isSelected = selectedTracks.includes(track.id);
                  return (
                    <button
                      key={track.id}
                      onClick={() => toggleTrack(track.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                        isSelected
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-blue-500' : 'bg-white/10'
                      }`}>
                        {isSelected ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          <Plus size={14} className="text-white/40" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium">{track.title}</p>
                        <p className="text-white/40 text-xs">{track.album} • {track.year}</p>
                      </div>
                      <Music size={16} className="text-white/20" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/5">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2 text-white/60 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
              >
                Next: Add Tracks
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-white/60 hover:text-white transition"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                <Check size={18} />
                Create Playlist ({selectedTracks.length} tracks)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
