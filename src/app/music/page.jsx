/**
 * MYSTATION - Music Browse Page
 * Full catalog with filters
 */

'use client';

import { useState } from 'react';
import TrackList from '@/components/TrackList';
import { tracks, albums, playlists, getOfficialTracks } from '@/data/tracks';
import { Search, SlidersHorizontal, Grid, List } from 'lucide-react';

export default function MusicPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');

  // Get only official tracks (exclude unreleased/unnamed)
  const officialTracks = getOfficialTracks();

  // Get unique years
  const years = [...new Set(officialTracks.map(t => t.year))].sort((a, b) => b - a);

  // Filter tracks
  const filteredTracks = officialTracks.filter(track => {
    const matchesSearch = track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.featured && track.featured.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesYear = filterYear === 'all' || track.year === parseInt(filterYear);
    const matchesType = filterType === 'all' ||
      (filterType === 'singles' && track.album === 'Single') ||
      (filterType === 'album' && track.albumId) ||
      (filterType === 'instrumental' && track.isInstrumental) ||
      (filterType === 'exclusive' && track.isExclusive);

    return matchesSearch && matchesYear && matchesType;
  });

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Browse Music</h1>
          <p className="text-white/60">
            {officialTracks.length} tracks • Free to stream • Support the Foundation
          </p>
        </div>

        {/* Search & Filters */}
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search tracks, features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mystation-gold"
              />
            </div>

            {/* Year Filter */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-mystation-gold"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-mystation-gold"
            >
              <option value="all">All Types</option>
              <option value="singles">Singles</option>
              <option value="album">Album Tracks</option>
              <option value="instrumental">Instrumentals</option>
              <option value="exclusive">Exclusives</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-mystation-gold text-mystation-dark' : 'text-white/60'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-mystation-gold text-mystation-dark' : 'text-white/60'}`}
              >
                <Grid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Playlists Row */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Playlists</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="flex-shrink-0 w-48 glass rounded-xl p-4 hover:bg-white/10 transition cursor-pointer"
              >
                <div className="w-full aspect-square bg-gradient-to-br from-mystation-gold/30 to-mystation-purple/30 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-3xl">🎧</span>
                </div>
                <h4 className="font-semibold text-white truncate">{playlist.title}</h4>
                <p className="text-white/60 text-sm truncate">{playlist.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {filterYear !== 'all' || filterType !== 'all' || searchQuery
                ? `Results (${filteredTracks.length})`
                : 'All Tracks'}
            </h2>
          </div>

          {filteredTracks.length > 0 ? (
            <TrackList trackIds={filteredTracks.map(t => t.id)} />
          ) : (
            <div className="text-center py-16">
              <p className="text-white/60 text-lg">No tracks found</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterYear('all');
                  setFilterType('all');
                }}
                className="text-mystation-gold hover:underline mt-4"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
