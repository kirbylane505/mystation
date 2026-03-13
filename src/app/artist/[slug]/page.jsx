'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ArtistProfile() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/creators/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleFollow = async () => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (!email) {
      alert('Sign in to follow creators');
      return;
    }

    const res = await fetch('/api/creators/follow', {
      method: following ? 'DELETE' : 'POST',
      ...(following
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creatorSlug: slug, followerEmail: decodeURIComponent(email) }),
          }),
    });

    if (following) {
      // Unfollow via DELETE with query params
      await fetch(`/api/creators/follow?creatorSlug=${slug}&followerEmail=${encodeURIComponent(decodeURIComponent(email))}`, {
        method: 'DELETE',
      });
    }

    setFollowing(!following);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Not Found</h1>
          <Link href="/creators" className="text-[#D4AF37] hover:underline">Browse Creators</Link>
        </div>
      </div>
    );
  }

  const { creator, tracks, merch } = data;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Banner */}
      <div className="h-48 md:h-64 bg-gradient-to-b from-[#D4AF37]/20 to-[#09090b] relative">
        {creator.banner_url && (
          <img src={creator.banner_url} alt="" className="w-full h-full object-cover absolute inset-0" />
        )}
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-[#18181b] border-4 border-[#09090b] overflow-hidden flex-shrink-0">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-[#D4AF37]">
                {creator.display_name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-3xl font-bold text-white">{creator.display_name}</h1>
            <p className="text-[#71717a] text-sm capitalize">{creator.category?.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Stats + Follow */}
        <div className="flex items-center gap-6 mb-6">
          <span className="text-[#a1a1aa] text-sm">{(creator.total_plays || 0).toLocaleString()} plays</span>
          <span className="text-[#a1a1aa] text-sm">{creator.track_count || 0} tracks</span>
          <span className="text-[#a1a1aa] text-sm">{(creator.follower_count || 0).toLocaleString()} followers</span>
          <button
            onClick={handleFollow}
            className={`ml-auto px-6 py-2 rounded-full text-sm font-bold transition-all ${
              following
                ? 'bg-[#27272a] text-white hover:bg-[#3f3f46]'
                : 'bg-[#D4AF37] text-black hover:bg-[#b8962e]'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Bio */}
        {creator.bio && <p className="text-[#a1a1aa] mb-6 max-w-2xl">{creator.bio}</p>}

        {/* Genre Tags */}
        {creator.genre_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {creator.genre_tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-[#18181b] border border-[#27272a] rounded-full text-xs text-[#a1a1aa]">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
        {creator.social_links && Object.values(creator.social_links).some(Boolean) && (
          <div className="flex gap-4 mb-8">
            {Object.entries(creator.social_links).map(([key, url]) =>
              url ? (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-[#71717a] hover:text-[#D4AF37] text-sm capitalize transition-colors">
                  {key}
                </a>
              ) : null
            )}
          </div>
        )}

        {/* Tracks */}
        {tracks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Music</h2>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors">
                  <div className="w-10 h-10 rounded bg-[#27272a] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.title}</p>
                    <p className="text-xs text-[#71717a]">{track.artist}{track.album ? ` \u2022 ${track.album}` : ''}</p>
                  </div>
                  <span className="text-[#52525b] text-xs">{(track.plays || 0).toLocaleString()} plays</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Merch */}
        {merch.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Merch</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {merch.map((item) => (
                <div key={item.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    <p className="text-[#D4AF37] font-bold text-sm">${Number(item.price).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
