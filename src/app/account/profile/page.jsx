/**
 * MYSTATION — My Profile Dashboard
 * Full profile view for subscribers with edit mode, community guidelines,
 * followers/following, and positive vibes enforcement.
 */

'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { useProfileStore } from '@/store/profileStore';
import AutoAvatar from '@/components/profile/AutoAvatar';
import { AVATAR_STYLES, PROFILE_LIMITS, TIER_BADGES } from '@/lib/profiles/constants';
import {
  Check, X, Loader2, Pencil, Users, Heart, Shield,
  Music, Flame, Award, BarChart3, ListMusic, Crown, UserPlus,
  ExternalLink, Copy, Share2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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

export default function MyProfilePage() {
  const { isSubscribed, isLoggedIn, supporterTier, email, user } = useUserStore();
  const { profile, fetchProfile, updateProfile, checkUsername } = useProfileStore();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    avatar_style: 'initials',
    avatar_url: '',
    banner_color: '#1e293b',
    show_now_playing: false,
  });
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('highlights');
  const [fullProfile, setFullProfile] = useState(null);

  const authenticated = isLoggedIn || isSubscribed;

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    // Fetch own profile from API
    fetchProfile().then(p => {
      if (p) {
        setForm({
          display_name: p.display_name || '',
          username: p.username || '',
          bio: p.bio || '',
          avatar_style: p.avatar_style || 'initials',
          avatar_url: p.avatar_url || '',
          banner_color: p.banner_color || '#1e293b',
          show_now_playing: p.show_now_playing || false,
        });
        // If has username, fetch full public profile for stats/badges/activity
        if (p.username) {
          fetch(`/api/profile/${encodeURIComponent(p.username)}`)
            .then(r => r.json())
            .then(d => { if (d.profile) setFullProfile(d.profile); })
            .catch(() => {});
        }
      } else {
        // No profile yet — auto-open edit mode so they can create one
        setEditing(true);
      }
      setLoading(false);
    }).catch(() => {
      // API auth failed but we know they're subscribed from store
      setEditing(true);
      setLoading(false);
    });
  }, [authenticated]);

  // Username validation
  useEffect(() => {
    if (!form.username || form.username === profile?.username) {
      setUsernameStatus(null);
      return;
    }
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!regex.test(form.username)) {
      setUsernameStatus('invalid');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const available = await checkUsername(form.username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  async function handleSave() {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') return;
    setSaving(true);
    const updates = { ...form };
    if (!profile) updates._isNew = true;
    const result = await updateProfile(updates);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setEditing(false);
      // Refresh full profile
      if (result.profile?.username) {
        fetch(`/api/profile/${encodeURIComponent(result.profile.username)}`)
          .then(r => r.json())
          .then(d => { if (d.profile) setFullProfile(d.profile); })
          .catch(() => {});
      }
    }
  }

  function copyProfileLink() {
    const url = `${window.location.origin}/station/${profile?.username || form.username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  }

  // --- Not authenticated ---
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
          <Users size={36} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Join the Community</h2>
        <p className="text-white/50 text-center max-w-sm mb-6">
          Subscribe to MyStation to get your profile, follow other members, and be part of the family.
        </p>
        <Link href="/subscribe" className="px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition">
          Subscribe for $4.99/mo
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-white/40 animate-spin" />
      </div>
    );
  }

  const tier = isSubscribed ? (supporterTier === 'diamond' ? 'diamond' : 'subscriber') : 'free';
  const tierConfig = TIER_BADGES[tier];
  const displayName = profile?.display_name || form.display_name || user?.name || email?.split('@')[0] || 'User';
  const username = profile?.username || form.username;
  const fp = fullProfile || profile;
  const followers = fp?.followers || 0;
  const following = fp?.following || 0;

  // --- Edit Mode ---
  if (editing) {
    return (
      <div className="min-h-screen pb-32">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile ? 'Edit Profile' : 'Create Your Profile'}
              </h1>
              <p className="text-white/40 text-sm">
                {profile ? 'Update your public profile' : 'Set up your MyStation identity'}
              </p>
            </div>
            {profile && (
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
                <X size={20} className="text-white/60" />
              </button>
            )}
          </div>

          {/* Avatar Preview */}
          <div className="flex flex-col items-center mb-8">
            <AutoAvatar
              userId={profile?.user_id || 'user'}
              displayName={form.display_name || 'AB'}
              avatarUrl={form.avatar_url}
              style={form.avatar_style}
              size={96}
              tierBorder={tierConfig.border}
            />
            <p className="text-white/30 text-xs mt-2">Preview</p>
          </div>

          {/* Avatar Style Picker */}
          <div className="mb-6">
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-2">Avatar Style</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {AVATAR_STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, avatar_style: s, avatar_url: '' }))}
                  className={`shrink-0 p-1 rounded-full transition ${
                    form.avatar_style === s && !form.avatar_url
                      ? 'ring-2 ring-blue-500'
                      : 'ring-1 ring-white/10 hover:ring-white/20'
                  }`}
                >
                  <AutoAvatar userId={profile?.user_id || 'user'} displayName={form.display_name || 'AB'} style={s} size={40} />
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value.slice(0, PROFILE_LIMITS.displayNameMax) }))}
              maxLength={PROFILE_LIMITS.displayNameMax}
              placeholder="Your name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-white/20 text-xs mt-1 text-right">{form.display_name.length}/{PROFILE_LIMITS.displayNameMax}</p>
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">@</span>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, PROFILE_LIMITS.usernameMax) }))}
                maxLength={PROFILE_LIMITS.usernameMax}
                placeholder="username"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-10 py-3 text-white focus:outline-none focus:border-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === 'checking' && <Loader2 size={16} className="text-white/30 animate-spin" />}
                {usernameStatus === 'available' && <Check size={16} className="text-green-400" />}
                {usernameStatus === 'taken' && <X size={16} className="text-red-400" />}
                {usernameStatus === 'invalid' && <X size={16} className="text-red-400" />}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="text-red-400 text-xs mt-1">Username taken</p>}
            {usernameStatus === 'invalid' && <p className="text-red-400 text-xs mt-1">3-20 chars, lowercase letters, numbers, underscores</p>}
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="text-white/50 text-xs font-medium uppercase tracking-wider block mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value.slice(0, PROFILE_LIMITS.bioMax) }))}
              maxLength={PROFILE_LIMITS.bioMax}
              placeholder="Tell people about yourself..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500"
            />
            <p className="text-white/20 text-xs mt-1 text-right">{form.bio.length}/{PROFILE_LIMITS.bioMax}</p>
          </div>

          {/* Subscriber Features */}
          {isSubscribed && (
            <div className="mb-6 p-4 bg-white/[0.03] rounded-xl border border-white/10">
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Subscriber Features</p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">Banner Color</span>
                <input
                  type="color"
                  value={form.banner_color}
                  onChange={e => setForm(f => ({ ...f, banner_color: e.target.value }))}
                  className="w-8 h-8 rounded border-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Show Now Playing</span>
                <button
                  onClick={() => setForm(f => ({ ...f, show_now_playing: !f.show_now_playing }))}
                  className={`w-10 h-6 rounded-full transition ${form.show_now_playing ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${form.show_now_playing ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || !form.username}
            className={`w-full py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
              saved ? 'bg-green-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
             : saved ? <><Check size={18} /> Saved!</>
             : profile ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </div>
    );
  }

  // --- Profile View ---
  const tabs = [
    { id: 'highlights', name: 'Highlights', icon: Flame },
    { id: 'playlists', name: 'Playlists', icon: ListMusic },
    { id: 'stats', name: 'Stats', icon: BarChart3 },
    { id: 'badges', name: 'Badges', icon: Award },
  ];

  return (
    <div className="min-h-screen pb-32">

      {/* Banner */}
      <div className="relative overflow-hidden">
        <div
          className="h-44 sm:h-52"
          style={{
            background: `linear-gradient(160deg, #0f172a 0%, ${tierConfig.color}18 40%, #0f172a 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10">
          <div className="flex flex-col items-center text-center">

            {/* Avatar */}
            <div className={`relative rounded-full ring-4 ${TIER_RING[tier]} shadow-xl ${TIER_GLOW[tier]}`}>
              <AutoAvatar
                userId={profile?.user_id || 'user'}
                displayName={displayName}
                avatarUrl={profile?.avatar_url}
                style={profile?.avatar_style || 'initials'}
                size={108}
                tierBorder={tierConfig.border}
              />
              {tier !== 'free' && (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-[#0a0e1a] flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: tierConfig.color }}
                >
                  {tier === 'diamond' ? '\u2666' : '\u2605'}
                </div>
              )}
            </div>

            {/* Name + Username */}
            <h1 className="text-3xl font-extrabold text-white mt-4 tracking-tight">
              {displayName}
            </h1>
            {username && (
              <p className="text-white/40 text-sm font-medium tracking-wide">@{username}</p>
            )}

            {/* Tier Badge */}
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
            {profile?.bio && (
              <p className="text-white/60 text-sm mt-3 max-w-md leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-8 mt-5">
              <div className="text-center">
                <p className="text-white text-lg font-bold tabular-nums">{followers}</p>
                <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">Followers</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white text-lg font-bold tabular-nums">{following}</p>
                <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">Following</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/15 text-white/80 rounded-full text-sm font-bold hover:bg-white/10 transition"
              >
                <Pencil size={14} />
                Edit Profile
              </button>
              {username && (
                <>
                  <button
                    onClick={copyProfileLink}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/15 text-white/80 rounded-full text-sm font-bold hover:bg-white/10 transition"
                    title="Copy profile link"
                  >
                    <Copy size={14} />
                  </button>
                  <Link
                    href={`/station/${username}`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/15 text-white/80 rounded-full text-sm font-bold hover:bg-white/10 transition"
                    title="View public profile"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-10">

        {/* Community Guidelines Card */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">MyStation Community</h3>
              <p className="text-indigo-300 text-xs">Positive vibes only</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex items-start gap-2">
              <Heart size={14} className="text-pink-400 mt-0.5 shrink-0" />
              <span>Support each other. This is a family. We build each other up.</span>
            </div>
            <div className="flex items-start gap-2">
              <Users size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <span>Follow other members, share playlists, and connect over music.</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield size={14} className="text-red-400 mt-0.5 shrink-0" />
              <span className="text-white/80 font-medium">No negativity, bullying, or hate. You will be removed from MyStation permanently.</span>
            </div>
          </div>
        </div>

        {/* Find People to Follow */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <UserPlus size={18} className="text-blue-400" />
              Build Your Community
            </h3>
          </div>
          <p className="text-white/50 text-sm mb-4">
            Follow other MyStation members. See what they're listening to, check out their playlists, and connect.
          </p>
          <Link
            href="/community"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition text-sm"
          >
            <Users size={16} />
            Browse Community
          </Link>
        </div>

        {/* Profile Content Tabs */}
        {profile && (
          <>
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

            {/* Highlights */}
            {activeTab === 'highlights' && (
              <div className="space-y-2.5">
                {(fp?.activity || []).length === 0 ? (
                  <div className="text-center py-16 text-white/20">
                    <Flame size={36} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-sm">No highlights yet</p>
                    <p className="text-xs mt-1 text-white/15">Play games, earn badges, and create playlists to see activity here</p>
                  </div>
                ) : (
                  (fp.activity || []).map(item => (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3.5 bg-white/[0.025] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition">
                      <span className="text-xl w-8 text-center">
                        {item.type === 'badge_earned' ? '\uD83C\uDFC5' :
                         item.type === 'game_win' ? '\uD83C\uDFC6' :
                         item.type === 'streak' ? '\uD83D\uDD25' :
                         item.type === 'playlist_created' ? '\uD83C\uDFB5' : '\u2B50'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm font-medium">
                          {item.type === 'badge_earned' ? `Earned a badge` :
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

            {/* Playlists */}
            {activeTab === 'playlists' && (
              <div className="space-y-2.5">
                {(fp?.playlists || []).length === 0 ? (
                  <div className="text-center py-16 text-white/20">
                    <ListMusic size={36} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-sm">No playlists yet</p>
                    <p className="text-xs mt-1 text-white/15">Create playlists from the music page</p>
                  </div>
                ) : (
                  (fp.playlists || []).map(playlist => (
                    <div key={playlist.id} className="flex items-center gap-4 p-4 bg-white/[0.025] rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Music size={20} className="text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">{playlist.name}</p>
                        <p className="text-white/30 text-xs font-medium">{playlist.trackCount || 0} tracks</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Stats */}
            {activeTab === 'stats' && (
              <div className="space-y-2.5">
                {(fp?.gameStats || []).length === 0 ? (
                  <div className="text-center py-16 text-white/20">
                    <BarChart3 size={36} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-sm">No game stats yet</p>
                    <Link href="/lounge" className="text-indigo-400 text-xs mt-2 inline-block hover:underline font-semibold">
                      Hit the Kickback Lounge
                    </Link>
                  </div>
                ) : (
                  (fp.gameStats || []).map(stat => (
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

            {/* Badges */}
            {activeTab === 'badges' && (
              <div className="text-center py-16 text-white/20">
                <Award size={36} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-sm">Badges coming soon</p>
                <p className="text-xs mt-1 text-white/15">Play games and engage to earn badges</p>
              </div>
            )}
          </>
        )}

        {/* No profile yet prompt */}
        {!profile && !editing && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Set Up Your Profile</h3>
            <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
              Create your profile so other members can find you, follow you, and connect.
            </p>
            <button
              onClick={() => setEditing(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition"
            >
              Create Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
