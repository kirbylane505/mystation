'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'musician', label: 'Musicians' },
  { value: 'podcaster', label: 'Podcasters' },
  { value: 'producer', label: 'Producers' },
  { value: 'dj', label: 'DJs' },
  { value: 'fitness_wellness', label: 'Fitness' },
  { value: 'barber_stylist', label: 'Barbers' },
  { value: 'visual_artist', label: 'Artists' },
  { value: 'chef_food', label: 'Food' },
  { value: 'educator_coach', label: 'Educators' },
  { value: 'comedian', label: 'Comedy' },
  { value: 'model_fashion', label: 'Fashion' },
  { value: 'content_creator', label: 'Creators' },
  { value: 'custom', label: 'Other' },
];

export default function BrowseCreators() {
  const [creators, setCreators] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (cat, q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    if (q) params.set('q', q);
    fetch(`/api/creators/browse?${params}`)
      .then((r) => r.json())
      .then((d) => setCreators(d.creators || []))
      .catch(() => setCreators([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(category, search); }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    load(category, search);
  };

  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-10 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Discover Creators</h1>
        <p className="text-[#71717a]">Find your next favorite artist on MyStation</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="flex-1 px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none"
          />
          <button type="submit" className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] transition-all">
            Search
          </button>
        </div>
      </form>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat.value
                ? 'bg-[#D4AF37] text-black'
                : 'bg-[#18181b] text-[#a1a1aa] border border-[#27272a] hover:border-[#3f3f46]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#71717a] text-lg mb-2">No creators found</p>
          <Link href="/creators/signup" className="text-[#D4AF37] hover:underline text-sm">
            Be the first! Join as a Creator
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {creators.map((c) => (
            <Link
              key={c.slug}
              href={`/artist/${c.slug}`}
              className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 hover:border-[#D4AF37]/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#27272a] overflow-hidden flex-shrink-0">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-[#D4AF37]">
                      {c.display_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{c.display_name}</p>
                  <p className="text-xs text-[#71717a] capitalize">{c.category?.replace('_', ' ')}</p>
                </div>
                {c.verified && (
                  <svg className="w-4 h-4 text-[#D4AF37] flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              {c.bio && <p className="text-[#71717a] text-xs line-clamp-2 mb-3">{c.bio}</p>}
              <div className="flex gap-4 text-xs text-[#52525b]">
                <span>{c.track_count || 0} tracks</span>
                <span>{(c.follower_count || 0).toLocaleString()} followers</span>
              </div>
              {c.genre_tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {c.genre_tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#09090b] rounded text-[10px] text-[#71717a]">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
