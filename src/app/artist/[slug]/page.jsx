'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import MyLifeGallery from '@/components/MyLifeGallery';

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ArtistProfile() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Inline email form state (for follow when no cookie)
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [isViewerCreator, setIsViewerCreator] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Video player state
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const videoRef = useRef(null);

  // Hidden videos (optimistic removal from UI)
  const [hiddenVideoIds, setHiddenVideoIds] = useState([]);

  // Load creator data
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

  // Check if viewer is a creator (for message button) + own profile detection
  useEffect(() => {
    const email = getCookie('mystation-email');
    if (!email) return;
    fetch(`/api/creators/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.creator) {
          setIsViewerCreator(true);
          if (d.creator.slug === slug) {
            setIsOwnProfile(true);
          }
        }
      })
      .catch(() => {});
  }, [slug]);

  const handleFollow = async (emailOverride) => {
    const email = emailOverride || getCookie('mystation-email');

    if (!email) {
      setShowEmailInput(true);
      return;
    }

    setFollowLoading(true);
    try {
      if (following) {
        await fetch(
          `/api/creators/follow?creatorSlug=${slug}&followerEmail=${encodeURIComponent(email)}`,
          { method: 'DELETE' }
        );
        setFollowing(false);
      } else {
        await fetch('/api/creators/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorSlug: slug, followerEmail: email }),
        });
        setFollowing(true);
      }
    } catch {
      // Silently fail — upsert handles idempotency
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEmailFollowSubmit = async (e) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    setCookie('mystation-email', trimmed, 365);
    setShowEmailInput(false);
    await handleFollow(trimmed);
  };

  const handleSubscribe = () => {
    usePlayerStore.getState().openSubscribeModal();
  };

  const handleSendMessage = async () => {
    const email = getCookie('mystation-email');
    if (!email || !data?.creator?.id || !messageText.trim()) return;

    setMessageSending(true);
    try {
      const res = await fetch('/api/creators/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          receiverId: data.creator.id,
          message: messageText.trim(),
        }),
      });
      if (res.ok) {
        setMessageSent(true);
        setMessageText('');
        setTimeout(() => {
          setShowMessageModal(false);
          setMessageSent(false);
        }, 2000);
      }
    } catch {
      // Fail silently
    } finally {
      setMessageSending(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    const email = getCookie('mystation-email');
    if (!email) return;
    setHiddenVideoIds((prev) => [...prev, videoId]);
    try {
      await fetch('/api/creators/videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id: videoId, status: 'hidden' }),
      });
    } catch {
      // Revert on failure
      setHiddenVideoIds((prev) => prev.filter((id) => id !== videoId));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not found
  if (!data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Not Found</h1>
          <Link href="/creators" className="text-[#D4AF37] hover:underline">
            Browse Creators
          </Link>
        </div>
      </div>
    );
  }

  const { creator, tracks, merch, videos, albums } = data;

  return (
    <div className="min-h-screen bg-[#09090b] pb-32">
      {/* === 1. BANNER === */}
      <div className="h-56 md:h-80 relative overflow-hidden">
        {creator.banner_url ? (
          <>
            {/* Blurred fill background */}
            <img
              src={creator.banner_url}
              alt=""
              className="w-full h-full object-cover absolute inset-0 scale-110 blur-2xl opacity-60"
            />
            {/* Sharp centered image */}
            <img
              src={creator.banner_url}
              alt=""
              className="w-full h-full object-cover absolute inset-0"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600/40 via-[#D4AF37]/20 to-blue-600/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4">
        {/* === 2. PROFILE HEADER === */}
        <div className="flex items-end gap-4 -mt-16 relative z-10 mb-4">
          <div className="w-36 h-36 rounded-full bg-gradient-to-br from-[#D4AF37] to-purple-600 p-[3px] flex-shrink-0 shadow-2xl shadow-[#D4AF37]/20">
            <div className="w-full h-full rounded-full bg-[#18181b] overflow-hidden">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.display_name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div className={`w-full h-full items-center justify-center text-5xl text-[#D4AF37] font-bold ${creator.avatar_url ? 'hidden' : 'flex'}`}>
                {creator.display_name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold text-white truncate">
                {creator.display_name}
              </h1>
              {creator.verified && (
                <svg className="w-6 h-6 text-[#D4AF37] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
              {/* === 3. LIVE NOW BADGE === */}
              {creator.is_live && (
                <Link
                  href={`/podstation/${creator.current_stream_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600/20 border border-red-500/40 rounded-full text-xs font-bold text-red-400 hover:bg-red-600/30 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  LIVE NOW
                </Link>
              )}
            </div>
            <p className="text-[#71717a] text-sm capitalize mt-1">
              {creator.category?.replace('_', ' ')}
            </p>
            {/* Genre Tags */}
            {creator.genre_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {creator.genre_tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-[#18181b] border border-[#27272a] rounded-full text-xs text-[#a1a1aa]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === 4. STATS ROW === */}
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{(creator.follower_count || 0).toLocaleString()}</p>
            <p className="text-[#71717a] text-xs uppercase tracking-wide">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{creator.track_count || 0}</p>
            <p className="text-[#71717a] text-xs uppercase tracking-wide">Tracks</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{(creator.total_plays || 0).toLocaleString()}</p>
            <p className="text-[#71717a] text-xs uppercase tracking-wide">Plays</p>
          </div>
        </div>

        {/* === 5. CTA BUTTONS === */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Follow Button */}
          {showEmailInput ? (
            <form onSubmit={handleEmailFollowSubmit} className="flex items-center gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-full text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-[#D4AF37] w-56"
                autoFocus
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#D4AF37] text-black rounded-full text-sm font-bold hover:bg-[#b8962e] transition-colors"
              >
                Follow
              </button>
              <button
                type="button"
                onClick={() => setShowEmailInput(false)}
                className="text-[#71717a] hover:text-white text-sm"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => handleFollow()}
              disabled={followLoading}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                following
                  ? 'bg-[#27272a] text-white hover:bg-[#3f3f46] border border-[#3f3f46]'
                  : 'bg-[#D4AF37] text-black hover:bg-[#b8962e]'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {followLoading ? '...' : following ? 'Following' : 'Follow'}
            </button>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all"
          >
            Subscribe to MyStation
          </button>

          {/* Message Button (visible only to other creators) */}
          {isViewerCreator && (
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </button>
          )}

          {/* Edit Profile Button (visible only on own profile) */}
          {isOwnProfile && (
            <Link
              href="/dashboard/settings"
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit Profile
            </Link>
          )}
        </div>

        {/* === 6. BIO === */}
        {creator.bio && (
          <p className="text-[#a1a1aa] mb-8 max-w-2xl leading-relaxed">{creator.bio}</p>
        )}

        {/* === 6.5 MY LIFE GALLERY === */}
        {albums && albums.length > 0 && (
          <div className="mb-8">
            <MyLifeGallery albums={albums} isOwnProfile={isOwnProfile} viewerAccess="public" />
          </div>
        )}

        {/* === 7. LIVE STREAM EMBED === */}
        {creator.is_live && creator.current_stream_id && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              Live Stream
            </h2>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                <Link
                  href={`/podstation/${creator.current_stream_id}`}
                  className="flex flex-col items-center gap-4 text-white hover:text-[#D4AF37] transition-colors"
                >
                  <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold">Watch Live</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* === 8. VIDEOS SECTION === */}
        {videos && videos.filter((v) => !hiddenVideoIds.includes(v.id)).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Videos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.filter((v) => !hiddenVideoIds.includes(v.id)).map((video) => (
                <div
                  key={video.id}
                  className="relative bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-colors"
                >
                  {/* Delete button (own profile only) */}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                      title="Remove video"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {playingVideoId === video.id ? (
                    <div className="aspect-video bg-black">
                      <video
                        ref={videoRef}
                        src={video.video_url}
                        controls
                        autoPlay
                        className="w-full h-full"
                        onEnded={() => setPlayingVideoId(null)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setPlayingVideoId(video.id)}
                      className="relative w-full aspect-video bg-[#27272a] group"
                    >
                      {video.video_url ? (
                        <video
                          src={video.video_url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-[#52525b]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {video.duration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </button>
                  )}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {video.views != null && (
                        <span className="text-[#71717a] text-xs">
                          {(video.views || 0).toLocaleString()} views
                        </span>
                      )}
                      {video.created_at && (
                        <span className="text-[#52525b] text-xs">{formatDate(video.created_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === 9. TRACKS SECTION === */}
        {tracks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Music</h2>
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-[#27272a] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {track.cover_url ? (
                      <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.title}</p>
                    <p className="text-xs text-[#71717a]">
                      {track.artist}
                      {track.album ? ` \u2022 ${track.album}` : ''}
                      {track.producer ? ` \u2022 Prod. ${track.producer}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {track.duration && (
                      <span className="text-[#52525b] text-xs">{formatDuration(track.duration)}</span>
                    )}
                    <span className="text-[#52525b] text-xs">
                      {(track.plays || 0).toLocaleString()} plays
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === 10. MERCH SECTION === */}
        {merch.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Merch</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {merch.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden hover:border-[#3f3f46] transition-colors"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-[#71717a] text-xs mt-0.5 truncate">{item.description}</p>
                    )}
                    <p className="text-[#D4AF37] font-bold text-sm mt-1">
                      ${Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === 11. SOCIAL LINKS === */}
        {creator.social_links && Object.values(creator.social_links).some(Boolean) && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4">Connect</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(creator.social_links).map(([key, url]) =>
                url ? (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#18181b] border border-[#27272a] rounded-full text-sm text-[#a1a1aa] hover:text-[#D4AF37] hover:border-[#D4AF37]/40 capitalize transition-colors"
                  >
                    {key}
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}
      </div>

      {/* === 12. MESSAGE MODAL === */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Message {creator.display_name}
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageSent(false);
                  setMessageText('');
                }}
                className="text-[#71717a] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {messageSent ? (
              <div className="text-center py-6">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-white font-medium">Message sent!</p>
              </div>
            ) : (
              <>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write your message..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-xl text-white text-sm placeholder-[#52525b] focus:outline-none focus:border-[#D4AF37] resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setShowMessageModal(false);
                      setMessageText('');
                    }}
                    className="px-4 py-2 text-sm text-[#71717a] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={messageSending || !messageText.trim()}
                    className="px-5 py-2 bg-[#D4AF37] text-black rounded-full text-sm font-bold hover:bg-[#b8962e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {messageSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
