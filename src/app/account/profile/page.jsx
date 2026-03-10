/**
 * MYSTATION — Edit Profile Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { useProfileStore } from '@/store/profileStore';
import AutoAvatar from '@/components/profile/AutoAvatar';
import { AVATAR_STYLES, PROFILE_LIMITS, TIER_BADGES } from '@/lib/profiles/constants';
import { Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { isSubscribed, supporterTier } = useUserStore();
  const { profile, fetchProfile, updateProfile, checkUsername } = useProfileStore();

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
  const [authenticated, setAuthenticated] = useState(true); // assume yes, API will confirm

  useEffect(() => {
    // Let the API handle auth via cookies — don't gate on client-side email
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
      }
      setLoading(false);
    }).catch(() => {
      setAuthenticated(false);
      setLoading(false);
    });
  }, []);

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
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-white/50 mb-4">Sign in to create your profile</p>
        <Link href="/subscribe" className="px-6 py-3 bg-blue-500 rounded-xl text-white font-semibold">
          Get Started
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

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          {profile ? 'Edit Profile' : 'Create Profile'}
        </h1>
        <p className="text-white/40 text-sm mb-8">
          {profile ? 'Update your public profile' : 'Set up your MyStation profile'}
        </p>

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8">
          <AutoAvatar
            userId={profile?.user_id || 'user'}
            displayName={form.display_name}
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

        {profile && (
          <Link href={`/station/${profile.username}`} className="block text-center text-blue-400 text-sm mt-4 hover:underline">
            View your profile
          </Link>
        )}
      </div>
    </div>
  );
}
