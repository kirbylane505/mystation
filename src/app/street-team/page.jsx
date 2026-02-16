/**
 * MYSTATION - Online Street Team
 * Referral engine with tier progression, leaderboard, and shareable links
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Copy, CheckCircle, Share2, Shield, Sword, Medal,
  Star, Crown, ChevronRight, Trophy, Loader2, ArrowRight, Zap
} from 'lucide-react';
import Link from 'next/link';
import { TIER_THRESHOLDS } from '@/lib/referral';

const TIER_ICONS = {
  shield: Shield,
  sword: Sword,
  medal: Medal,
  star: Star,
  crown: Crown,
};

const TIER_COLORS = {
  Recruit: { bg: 'from-zinc-600 to-zinc-700', text: 'text-zinc-300', border: 'border-zinc-600/40', glow: '' },
  Soldier: { bg: 'from-green-600 to-emerald-700', text: 'text-green-400', border: 'border-green-500/40', glow: 'shadow-green-500/10' },
  Lieutenant: { bg: 'from-blue-600 to-indigo-700', text: 'text-blue-400', border: 'border-blue-500/40', glow: 'shadow-blue-500/10' },
  Captain: { bg: 'from-purple-600 to-violet-700', text: 'text-purple-400', border: 'border-purple-500/40', glow: 'shadow-purple-500/10' },
  General: { bg: 'from-yellow-500 to-amber-600', text: 'text-yellow-400', border: 'border-yellow-500/40', glow: 'shadow-yellow-500/20' },
};

export default function StreetTeamPage() {
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [code, setCode] = useState('');
  const [tier, setTier] = useState('Recruit');
  const [reward, setReward] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Check if user already has a code stored
  useEffect(() => {
    setMounted(true);
    const savedEmail = localStorage.getItem('mystation_email');
    const savedCode = localStorage.getItem('mystation_street_team_code');
    if (savedEmail && savedCode) {
      setEmail(savedEmail);
      setCode(savedCode);
      fetchStats(savedCode);
    } else if (savedEmail) {
      setEmail(savedEmail);
      setInputEmail(savedEmail);
    }
    fetchLeaderboard();
  }, []);

  const fetchStats = useCallback(async (refCode) => {
    try {
      const resp = await fetch(`/api/referral?code=${encodeURIComponent(refCode)}`);
      if (resp.ok) {
        const data = await resp.json();
        setReferralCount(data.referralCount || 0);
        setTier(data.tier || 'Recruit');
        setReward(data.reward || '');
      }
    } catch (err) {
      // silently handle referral stats fetch error
    }
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const resp = await fetch('/api/referral?leaderboard=true');
      if (resp.ok) {
        const data = await resp.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      // silently handle leaderboard fetch error
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inputEmail || !inputEmail.includes('@')) {
      setError('Enter a valid email');
      return;
    }

    setJoining(true);
    setError('');

    try {
      // Check for referrer code (from cookie or localStorage)
      const referrerCode = localStorage.getItem('mystation_referred_by') || null;

      const resp = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputEmail,
          referrerCode,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Something went wrong');
        setJoining(false);
        return;
      }

      const data = await resp.json();
      const newCode = data.code;

      // Store in localStorage
      localStorage.setItem('mystation_email', inputEmail.toLowerCase().trim());
      localStorage.setItem('mystation_street_team_code', newCode);

      setEmail(inputEmail.toLowerCase().trim());
      setCode(newCode);
      setTier(data.tier || 'Recruit');
      setReward(data.reward || 'Exclusive wallpaper');
      setReferralCount(data.referralCount || 0);

      // Also capture email for marketing
      fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputEmail, source: 'street-team' }),
      }).catch(() => {});
    } catch (err) {
      setError('Network error. Try again.');
    }

    setJoining(false);
  };

  const referralLink = code ? `https://mystationlive.com/ref/${code}` : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join the IDMG Street Team',
          text: 'Join MyStation and we both earn rewards. Stream music, shop merch, and rep the movement.',
          url: referralLink,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  // Calculate progress to next tier
  const currentTierIndex = TIER_THRESHOLDS.findIndex((t) => t.name === tier);
  const nextTier = TIER_THRESHOLDS[currentTierIndex + 1] || null;
  const prevMin = TIER_THRESHOLDS[currentTierIndex]?.min || 0;
  const nextMin = nextTier?.min || prevMin + 10;
  const progress = nextTier
    ? Math.min(100, ((referralCount - prevMin) / (nextMin - prevMin)) * 100)
    : 100;

  if (!mounted) return null;

  const tierColors = TIER_COLORS[tier] || TIER_COLORS.Recruit;

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-wider uppercase mb-4">
          <Zap size={12} />
          Online Street Team
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 font-display">
          Rep the Movement.{' '}
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Earn Rewards.
          </span>
        </h1>
        <p className="text-white/50 text-sm md:text-base max-w-md mx-auto">
          Share your link. When friends join MyStation, you both level up. Climb the ranks from Recruit to General.
        </p>
      </div>

      {/* === JOINED VIEW === */}
      {code ? (
        <div className="space-y-6">
          {/* Stats Card */}
          <div className={`relative overflow-hidden rounded-2xl border ${tierColors.border} bg-[#111] p-6 ${tierColors.glow} shadow-xl`}>
            {/* Tier Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tierColors.bg} flex items-center justify-center shadow-lg`}>
                  {(() => {
                    const IconComp = TIER_ICONS[TIER_THRESHOLDS[currentTierIndex]?.icon] || Shield;
                    return <IconComp size={22} className="text-white" />;
                  })()}
                </div>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Your Rank</p>
                  <p className={`text-xl font-black ${tierColors.text}`}>{tier}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-xs">Referrals</p>
                <p className="text-3xl font-black text-white">{referralCount}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {nextTier && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                  <span>{tier}</span>
                  <span>{nextTier.name} at {nextTier.min} referrals</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tierColors.bg} transition-all duration-700 ease-out`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">
                  {nextTier.min - referralCount} more to unlock {nextTier.name}
                </p>
              </div>
            )}

            {/* Current Reward */}
            {reward && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
                <Trophy size={14} className="text-yellow-400 shrink-0" />
                <span className="text-white/60 text-sm">Current reward: <span className="text-white font-semibold">{reward}</span></span>
              </div>
            )}
          </div>

          {/* Share Card */}
          <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Share2 size={16} className="text-purple-400" />
              Your Referral Link
            </h3>

            {/* Link Display */}
            <div className="flex items-stretch gap-2 mb-4">
              <div className="flex-1 flex items-center px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <span className="text-white/50 text-sm truncate">{referralLink}</span>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 px-4 bg-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/20 transition flex items-center gap-1.5 text-sm font-medium"
              >
                {copied ? (
                  <>
                    <CheckCircle size={14} className="text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleShare}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 text-sm"
            >
              <Share2 size={16} />
              Share with Friends
            </button>

            <p className="text-white/30 text-xs text-center mt-3">
              Your code: <span className="text-white/60 font-mono font-bold">{code}</span>
            </p>
          </div>

          {/* Tiers Overview */}
          <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Crown size={16} className="text-yellow-400" />
              Street Team Ranks
            </h3>
            <div className="space-y-3">
              {TIER_THRESHOLDS.map((t, i) => {
                const isActive = t.name === tier;
                const isComplete = currentTierIndex > i;
                const TierIcon = TIER_ICONS[t.icon] || Shield;
                const colors = TIER_COLORS[t.name] || TIER_COLORS.Recruit;

                return (
                  <div
                    key={t.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition ${
                      isActive
                        ? `bg-gradient-to-r ${colors.bg}/10 border ${colors.border}`
                        : isComplete
                        ? 'bg-white/5 border border-white/5 opacity-60'
                        : 'bg-white/[0.02] border border-white/5'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive || isComplete
                          ? `bg-gradient-to-br ${colors.bg}`
                          : 'bg-white/5'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : (
                        <TierIcon size={16} className={isActive ? 'text-white' : 'text-white/30'} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isActive ? colors.text : 'text-white/60'}`}>
                          {t.name}
                        </span>
                        <span className="text-white/20 text-xs">{t.min}+ referrals</span>
                      </div>
                      <p className="text-white/40 text-xs truncate">{t.reward}</p>
                    </div>
                    {isActive && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                Leaderboard
              </h3>
              <div className="space-y-2">
                {leaderboard.map((entry) => {
                  const isUser = entry.code === code;
                  const colors = TIER_COLORS[entry.tier] || TIER_COLORS.Recruit;

                  return (
                    <div
                      key={entry.rank}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isUser ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                          entry.rank === 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.rank === 2
                            ? 'bg-zinc-300/20 text-zinc-300'
                            : entry.rank === 3
                            ? 'bg-amber-600/20 text-amber-500'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-mono font-bold ${isUser ? 'text-purple-400' : 'text-white/70'}`}>
                          {entry.code}
                          {isUser && <span className="text-purple-400/60 text-xs ml-1">(you)</span>}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold ${colors.text}`}>{entry.tier}</span>
                      <span className="text-white/40 text-sm font-bold tabular-nums w-8 text-right">
                        {entry.referralCount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* === JOIN VIEW === */
        <div className="space-y-6">
          {/* Join Card */}
          <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Users size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Join the Street Team</h2>
                <p className="text-white/40 text-sm">Get your referral code instantly</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition"
                required
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={joining}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {joining ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    Get My Code
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* How It Works */}
          <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
            <h3 className="text-white font-bold mb-4">How It Works</h3>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Get your code', desc: 'Enter your email above to generate a unique referral link.', color: 'purple' },
                { step: 2, title: 'Share the link', desc: 'Send your link to friends via text, social media, or DM.', color: 'blue' },
                { step: 3, title: 'Level up', desc: 'Every friend who joins earns you points. Hit milestones to unlock rewards.', color: 'green' },
              ].map(({ step, title, desc, color }) => (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      color === 'purple' ? 'bg-purple-500/20' : color === 'blue' ? 'bg-blue-500/20' : 'bg-green-500/20'
                    }`}
                  >
                    <span
                      className={`font-bold text-sm ${
                        color === 'purple' ? 'text-purple-400' : color === 'blue' ? 'text-blue-400' : 'text-green-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{title}</p>
                    <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tiers Preview */}
          <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Crown size={16} className="text-yellow-400" />
              Rewards Tiers
            </h3>
            <div className="space-y-3">
              {TIER_THRESHOLDS.map((t) => {
                const TierIcon = TIER_ICONS[t.icon] || Shield;
                const colors = TIER_COLORS[t.name] || TIER_COLORS.Recruit;

                return (
                  <div
                    key={t.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center shrink-0`}>
                      <TierIcon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${colors.text}`}>{t.name}</span>
                        <span className="text-white/20 text-xs">{t.min}+ referrals</span>
                      </div>
                      <p className="text-white/40 text-xs truncate">{t.reward}</p>
                    </div>
                    <ChevronRight size={14} className="text-white/20 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard Preview */}
          {leaderboard.length > 0 && (
            <div className="rounded-2xl border border-[#222] bg-[#111] p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                Top Referrers
              </h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry) => {
                  const colors = TIER_COLORS[entry.tier] || TIER_COLORS.Recruit;
                  return (
                    <div
                      key={entry.rank}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]"
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                          entry.rank === 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : entry.rank === 2
                            ? 'bg-zinc-300/20 text-zinc-300'
                            : entry.rank === 3
                            ? 'bg-amber-600/20 text-amber-500'
                            : 'bg-white/5 text-white/30'
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <span className="text-sm font-mono font-bold text-white/70 flex-1 min-w-0 truncate">
                        {entry.code}
                      </span>
                      <span className={`text-xs font-semibold ${colors.text}`}>{entry.tier}</span>
                      <span className="text-white/40 text-sm font-bold tabular-nums w-8 text-right">
                        {entry.referralCount}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/20 text-xs text-center mt-3">Join to see your ranking</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center mt-8 pb-4">
        <p className="text-white/20 text-xs">
          IDMG Online Street Team &mdash; All proceeds support youth music programs
        </p>
        <Link href="/" className="text-purple-400/60 text-xs hover:text-purple-400 transition mt-1 inline-block">
          Back to MyStation
        </Link>
      </div>
    </div>
  );
}
