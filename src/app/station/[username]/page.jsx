/**
 * MYSTATION — Station/Profile Page
 * Checks profiles table first, falls back to creator station
 * Branded with MyStation equalizer logo + Montserrat font
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useUserStore } from '@/store/playerStore';
import { useProfileStore } from '@/store/profileStore';
import AutoAvatar from '@/components/profile/AutoAvatar';
import { BADGE_DEFINITIONS } from '@/lib/profiles/badges';
import { TIER_BADGES } from '@/lib/profiles/constants';
import Image from 'next/image';
import {
  Music, ListMusic, Trophy, Award, Flame,
  Play, Lock, BarChart3
} from 'lucide-react';
import Link from 'next/link';
import CreatorStationContent from './CreatorStationContent';

// Tier glow colors for avatar ring
const TIER_GLOW = {
  free: 'shadow-slate-500/20',
  subscriber: 'shadow-purple-500/40',
  diamond: 'shadow-amber-400/50',
};

const TIER_RING = {
  free: 'ring-slate-500/40',
  subscriber: 'ring-purple-500/60',
  diamond: 'ring-amber-400/70',
};

export default function StationPage() {
  const params = useParams();
  const { username } = params;
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreatorStation, setIsCreatorStation] = useState(false);
  const [activeTab, setActiveTab] = useState('highlights');

  const { email } = useUserStore();
  const { toggleFollow } = useProfileStore();

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, [username]);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data.profile) {
        setProfileData(data.profile);
        setIsCreatorStation(false);
      } else {
        setIsCreatorStation(true);
      }
    } catch {
      setIsCreatorStation(true);
    }
    setLoading(false);
  }

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isCreatorStation) {
    return <CreatorStationContent username={username} />;
  }

  const profile = profileData;
  const tier = profile.tier || 'free';
  const tierConfig = TIER_BADGES[tier] || TIER_BADGES.free;

  async function handleFollow() {
    const result = await toggleFollow(profile.user_id);
    if (result.following !== undefined) {
      setProfileData(prev => ({
        ...prev,
        isFollowing: result.following,
        followers: prev.followers + (result.following ? 1 : -1),
      }));
    }
  }

  const tabs = [
    { id: 'highlights', name: 'Highlights', icon: Flame },
    { id: 'playlists', name: 'Playlists', icon: ListMusic },
    { id: 'stats', name: 'Stats', icon: BarChart3 },
    { id: 'badges', name: 'Badges', icon: Award },
  ];

  const earnedBadgeIds = new Set((profile.badges || []).map(b => b.badge_id));

  return (
    <div className="min-h-screen pb-32 font-[var(--font-montserrat)]">

      {/* ── BANNER ── */}
      <div className="relative overflow-hidden">
        {/* Gradient banner with tier accent */}
        <div
          className="h-44 sm:h-52"
          style={{
            background: `linear-gradient(160deg, #0f172a 0%, ${tierConfig.color}18 40%, #0f172a 100%)`,
          }}
        >
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
        </div>

        {/* ── PROFILE CARD ── */}
        <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10">
          <div className="flex flex-col items-center text-center">

            {/* Avatar with MyStation logo fallback */}
            <div className={`relative rounded-full ring-4 ${TIER_RING[tier]} shadow-xl ${TIER_GLOW[tier]}`}>
              {profile.avatar_url ? (
                <AutoAvatar
                  userId={profile.user_id}
                  displayName={profile.display_name}
                  avatarUrl={profile.avatar_url}
                  style={profile.avatar_style}
                  size={108}
                />
              ) : (
                <div className="w-[108px] h-[108px] rounded-full bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/mystation-logo.png"
                    alt="MyStation"
                    width={72}
                    height={72}
                    className="object-contain"
                  />
                </div>
              )}
              {/* Tier indicator dot */}
              {tier !== 'free' && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0a0e1a] flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: tierConfig.color }}
                >
                  {tier === 'diamond' ? '\u2666' : '\u2605'}
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">
              {profile.display_name}
            </h1>
            <p className="text-white/40 text-sm font-medium tracking-wide">@{profile.username}</p>

            {/* Tier badge */}
            <span
              className="mt-2.5 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border"
              style={{
                backgroundColor: tierConfig.color + '15',
                color: tierConfig.color,
                borderColor: tierConfig.color + '30',
              }}
            >
              {tierConfig.label}
            </span>

            {/* Bio */}
            {profile.bio && (
              <p className="text-white/60 text-sm mt-3 max-w-md leading-relaxed font-[var(--font-inter)]">
                {profile.bio}
              </p>
            )}

            {/* Stats + Follow */}
            <div className="flex items-center gap-8 mt-5">
              <div className="text-center">
                <p className="text-white text-lg font-bold tabular-nums">{profile.followers || 0}</p>
                <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">Followers</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white text-lg font-bold tabular-nums">{profile.following || 0}</p>
                <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">Following</p>
              </div>

              {email && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <button
                    onClick={handleFollow}
                    className={`px-7 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-200 ${
                      profile.isFollowing
                        ? 'bg-white/[0.06] text-white/80 border border-white/15 hover:bg-white/10 hover:text-white'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-px'
                    }`}
                  >
                    {profile.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="max-w-2xl mx-auto px-4 mt-10">
        <div className="flex border-b border-white/[0.06] mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-white border-indigo-500'
                  : 'text-white/30 border-transparent hover:text-white/50'
              }`}
            >
              <tab.icon size={15} />
              {tab.name}
            </button>
          ))}
        </div>

        {/* ── HIGHLIGHTS TAB ── */}
        {activeTab === 'highlights' && (
          <div className="space-y-2.5">
            {(profile.activity || []).length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <Flame size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-sm">No highlights yet</p>
                <p className="text-xs mt-1 text-white/15">Play games and earn badges to see activity here</p>
              </div>
            ) : (
              profile.activity.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3.5 bg-white/[0.025] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition">
                  <span className="text-xl w-8 text-center">
                    {item.type === 'badge_earned' ? (BADGE_DEFINITIONS[item.data?.badge_id]?.icon || '\uD83C\uDFC5') :
                     item.type === 'game_win' ? '\uD83C\uDFC6' :
                     item.type === 'streak' ? '\uD83D\uDD25' :
                     item.type === 'playlist_created' ? '\uD83C\uDFB5' : '\u2B50'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium">
                      {item.type === 'badge_earned' ? `Earned "${BADGE_DEFINITIONS[item.data?.badge_id]?.name || 'Badge'}"` :
                       item.type === 'game_win' ? `Won a game of ${item.data?.game_type || 'unknown'}` :
                       item.type === 'streak' ? `${item.data?.streak_count}-game win streak!` :
                       item.type === 'playlist_created' ? `Created playlist "${item.data?.name || ''}"` :
                       item.data?.message || 'Activity'}
                    </p>
                    <p className="text-white/25 text-xs mt-0.5 font-medium">
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── PLAYLISTS TAB ── */}
        {activeTab === 'playlists' && (
          <div className="space-y-2.5">
            {(profile.playlists || []).length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <ListMusic size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-sm">{profile.tier === 'free' ? 'Playlists are a subscriber feature' : 'No playlists yet'}</p>
                {profile.tier === 'free' && (
                  <Link href="/subscribe" className="text-indigo-400 text-xs mt-2 inline-block hover:underline font-semibold">
                    Subscribe to create playlists
                  </Link>
                )}
              </div>
            ) : (
              profile.playlists.map(playlist => (
                <div key={playlist.id} className="flex items-center gap-4 p-4 bg-white/[0.025] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition group">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Music size={20} className="text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{playlist.name}</p>
                    <p className="text-white/30 text-xs font-medium">{playlist.trackCount || 0} tracks</p>
                  </div>
                  <button className="p-2.5 bg-indigo-500/20 rounded-full text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === 'stats' && (
          <div className="space-y-2.5">
            {(profile.gameStats || []).length === 0 ? (
              <div className="text-center py-16 text-white/20">
                <Trophy size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-sm">No game stats yet</p>
                <Link href="/lounge" className="text-indigo-400 text-xs mt-2 inline-block hover:underline font-semibold">
                  Hit the Kickback Lounge
                </Link>
              </div>
            ) : (
              profile.gameStats.map(stat => (
                <div key={stat.game_type} className="p-5 bg-white/[0.025] rounded-2xl border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white font-bold capitalize tracking-wide">{stat.game_type}</p>
                    <span className="text-white/25 text-xs font-semibold">{stat.games_played} games</span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-emerald-400 font-bold text-lg">{stat.wins}</span>
                      <span className="text-white/25 ml-1.5 text-xs font-semibold uppercase">W</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-bold text-lg">{stat.losses}</span>
                      <span className="text-white/25 ml-1.5 text-xs font-semibold uppercase">L</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-bold text-lg">{stat.best_streak}</span>
                      <span className="text-white/25 ml-1.5 text-xs font-semibold uppercase">Streak</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-indigo-400 font-bold text-lg">{stat.points_earned}</span>
                      <span className="text-white/25 ml-1.5 text-xs font-semibold uppercase">pts</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── BADGES TAB ── */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Object.values(BADGE_DEFINITIONS).map(badge => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center p-4 rounded-2xl text-center transition border ${
                    earned
                      ? 'bg-white/[0.04] border-white/[0.08]'
                      : 'bg-white/[0.015] border-white/[0.03] opacity-35'
                  }`}
                >
                  <span className="text-2xl mb-1.5">{badge.icon}</span>
                  <p className="text-white text-xs font-bold">{badge.name}</p>
                  <p className="text-white/25 text-[10px] mt-0.5 leading-tight font-medium">{badge.description}</p>
                  {!earned && <Lock size={10} className="text-white/15 mt-1.5" />}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MYSTATION BRANDING FOOTER ── */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2 opacity-30">
          <Image src="/images/mystation-logo.png" alt="MyStation" width={20} height={20} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">MyStation</span>
        </div>
      </div>
    </div>
  );
}
