/**
 * MYSTATION — Fan Command Center
 * Admin dashboard: leaderboard, messaging, tier upgrades
 * Protected: requires ADMIN_KEY query param
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Play, Trophy, Crown, Mail, ArrowUp, RefreshCw, X, Star, Shield, Gem, Zap, AlertTriangle } from 'lucide-react';

const TIER_STYLES = {
  listener: { label: 'Listener', bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  supporter: { label: 'Supporter', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  premium: { label: 'Premium', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  diamond: { label: 'Diamond', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  vip: { label: 'VIP', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const TIER_ORDER = ['listener', 'supporter', 'premium', 'diamond', 'vip'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={18} className={color} />
        <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-black ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function TierBadge({ tier }) {
  const style = TIER_STYLES[tier] || TIER_STYLES.listener;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === 'active') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Active</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400">Free</span>;
}

// ---- Message Modal ----
function MessageModal({ fan, adminKey, onClose, onSent }) {
  const [subject, setSubject] = useState(`Hey from MyStation`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fans/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fan.email, subject, message, key: adminKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send');
      onSent(fan.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0f1629] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-lg font-bold flex items-center gap-2">
              <Mail size={18} className="text-blue-400" /> Send Message
            </h3>
            <p className="text-white/40 text-sm mt-1">To: {fan.email}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition"
              placeholder="Email subject..."
            />
          </div>
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={6}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition resize-none"
              placeholder={`Hey${fan.name ? ' ' + fan.name.split(' ')[0] : ''},\n\nJust wanted to say...`}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? <RefreshCw size={14} className="animate-spin" /> : <Mail size={14} />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Upgrade Modal ----
function UpgradeModal({ fan, adminKey, onClose, onUpgraded }) {
  const [newTier, setNewTier] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState(null);

  const currentTierIdx = TIER_ORDER.indexOf(fan.tier || 'listener');

  const handleUpgrade = async () => {
    if (!newTier) return;
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/fans/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fan.email, newTier, key: adminKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to upgrade');
      onUpgraded(fan.email, newTier);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0f1629] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-lg font-bold flex items-center gap-2">
              <ArrowUp size={18} className="text-yellow-400" /> Upgrade Tier
            </h3>
            <p className="text-white/40 text-sm mt-1">{fan.email}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Current Tier</label>
            <div className="py-2">
              <TierBadge tier={fan.tier || 'listener'} />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">New Tier</label>
            <select
              value={newTier}
              onChange={e => setNewTier(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 transition appearance-none"
            >
              <option value="" className="bg-[#0f1629]">Select tier...</option>
              {TIER_ORDER.map((t, idx) => {
                if (idx <= currentTierIdx) return null;
                const style = TIER_STYLES[t];
                return (
                  <option key={t} value={t} className="bg-[#0f1629]">
                    {style.label}{t === 'supporter' ? ' ($4.99/mo)' : t === 'premium' ? ' ($9.99/mo)' : t === 'diamond' ? ' ($14.99/mo)' : t === 'vip' ? ' (Invite Only)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {newTier && (
            <div className={`p-3 rounded-xl border ${TIER_STYLES[newTier]?.border || 'border-white/10'} bg-white/5`}>
              <p className="text-white/60 text-xs">A congratulations email will be sent to the fan with their new tier benefits.</p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 text-white/60 rounded-xl text-sm font-medium hover:bg-white/10 transition">
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgrading || !newTier}
              className="flex-1 px-4 py-3 bg-yellow-500 text-black rounded-xl text-sm font-bold hover:bg-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {upgrading ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUp size={14} />}
              {upgrading ? 'Upgrading...' : 'Upgrade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function FanCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [messageModal, setMessageModal] = useState(null);
  const [upgradeModal, setUpgradeModal] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/fans?key=${key}&limit=50`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (key) {
      setAdminKey(key);
      setAuthorized(true);
      fetchData(key);
    } else {
      setLoading(false);
    }
  }, [fetchData]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMessageSent = (email) => {
    setMessageModal(null);
    showToast(`Message sent to ${email}`);
  };

  const handleUpgraded = (email, newTier) => {
    setUpgradeModal(null);
    const label = TIER_STYLES[newTier]?.label || newTier;
    showToast(`${email} upgraded to ${label}`);
    // Refresh data to reflect new tier
    fetchData(adminKey);
  };

  // Access denied
  if (!authorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Only</h1>
          <p className="text-white/50">This page requires admin access.</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const fans = data?.fans || [];
  const fiftyPlusCount = stats.fiftyPlusClub || 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Crown size={32} className="text-yellow-400" />
              Fan Command Center
            </h1>
            <p className="text-white/50 text-sm mt-1">Track, message, and reward your top listeners</p>
          </div>
          <button
            onClick={() => fetchData(adminKey)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* 50+ Plays Alert Banner */}
        {fiftyPlusCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-400 shrink-0" />
            <p className="text-yellow-300 text-sm font-medium">
              <span className="font-black">{fiftyPlusCount} fan{fiftyPlusCount !== 1 ? 's' : ''}</span> crossed 50 plays! Consider rewarding them with a tier upgrade or personal message.
            </p>
          </div>
        )}

        {loading && !data ? (
          // Skeleton loader
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 border border-white/10 animate-pulse">
                  <div className="h-3 bg-white/10 rounded w-20 mb-3" />
                  <div className="h-8 bg-white/10 rounded w-16" />
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/5 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-8" />
                  <div className="h-4 bg-white/10 rounded flex-1 max-w-[200px]" />
                  <div className="h-4 bg-white/10 rounded w-12" />
                  <div className="h-4 bg-white/10 rounded w-24 hidden sm:block" />
                  <div className="h-4 bg-white/10 rounded w-16 hidden md:block" />
                  <div className="h-4 bg-white/10 rounded w-16 hidden md:block" />
                  <div className="h-4 bg-white/10 rounded w-28 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="text-center py-20">
            <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Failed to load</h2>
            <p className="text-white/50 mb-6">{error}</p>
            <button
              onClick={() => fetchData(adminKey)}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} label="Total Fans" value={stats.totalFans || 0} color="text-blue-400" />
              <StatCard icon={Star} label="Active Subscribers" value={stats.activeSubscribers || 0} color="text-green-400" />
              <StatCard icon={Trophy} label="50+ Play Club" value={stats.fiftyPlusClub || 0} color="text-yellow-400" />
              <StatCard icon={Play} label="Total Plays" value={stats.totalPlays || 0} color="text-purple-400" />
            </div>

            {/* Leaderboard */}
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-400" /> Fan Leaderboard
                </h2>
                <span className="text-white/30 text-xs">{fans.length} fans</span>
              </div>

              {/* Desktop header */}
              <div className="hidden md:grid grid-cols-[60px_1fr_80px_180px_100px_80px_160px] px-6 py-3 border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                <span>Rank</span>
                <span>Fan</span>
                <span className="text-right">Plays</span>
                <span className="pl-4">Top Track</span>
                <span className="text-center">Status</span>
                <span className="text-center">Tier</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {fans.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={32} className="text-white/20 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">No fan data yet. Play events will populate the leaderboard.</p>
                  </div>
                ) : (
                  fans.map((fan) => {
                    const isGold = fan.play_count >= 50;
                    return (
                      <div
                        key={fan.id}
                        className={`grid grid-cols-1 md:grid-cols-[60px_1fr_80px_180px_100px_80px_160px] gap-2 md:gap-0 items-center px-6 py-4 border-b border-white/5 hover:bg-white/[0.03] transition ${
                          isGold ? 'border-l-2 border-l-yellow-500/60 bg-yellow-500/[0.03]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex items-center gap-2 md:block">
                          <span className={`text-sm font-black ${
                            fan.rank === 1 ? 'text-yellow-400' :
                            fan.rank === 2 ? 'text-gray-300' :
                            fan.rank === 3 ? 'text-amber-600' :
                            'text-white/30'
                          }`}>
                            {fan.rank <= 3 ? (
                              <span className="flex items-center gap-1">
                                {fan.rank === 1 && <Crown size={14} />}
                                #{fan.rank}
                              </span>
                            ) : (
                              `#${fan.rank}`
                            )}
                          </span>
                          {/* Mobile: show email inline with rank */}
                          <span className="md:hidden text-white text-sm truncate flex-1">{fan.name || fan.email}</span>
                        </div>

                        {/* Fan email - desktop */}
                        <div className="hidden md:block min-w-0">
                          <p className="text-white text-sm truncate">{fan.name || fan.email}</p>
                          {fan.name && <p className="text-white/30 text-xs truncate">{fan.email}</p>}
                        </div>

                        {/* Plays */}
                        <div className="flex items-center gap-2 md:block md:text-right">
                          <span className="text-white/40 text-xs md:hidden">Plays:</span>
                          <span className={`font-black text-sm ${isGold ? 'text-yellow-400' : 'text-white'}`}>
                            {fan.play_count.toLocaleString()}
                          </span>
                        </div>

                        {/* Top Track */}
                        <div className="flex items-center gap-2 md:block md:pl-4 min-w-0">
                          <span className="text-white/40 text-xs md:hidden shrink-0">Top:</span>
                          <p className="text-white/60 text-xs truncate">
                            {fan.top_tracks?.[0]?.title || '—'}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2 md:justify-center">
                          <span className="text-white/40 text-xs md:hidden">Status:</span>
                          <StatusBadge status={fan.subscriber_status} />
                        </div>

                        {/* Tier */}
                        <div className="flex items-center gap-2 md:justify-center">
                          <span className="text-white/40 text-xs md:hidden">Tier:</span>
                          <TierBadge tier={fan.tier} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setMessageModal(fan)}
                            className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/30 transition flex items-center gap-1"
                          >
                            <Mail size={12} /> Message
                          </button>
                          <button
                            onClick={() => setUpgradeModal(fan)}
                            className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-semibold hover:bg-yellow-500/30 transition flex items-center gap-1"
                          >
                            <ArrowUp size={12} /> Upgrade
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {messageModal && (
        <MessageModal
          fan={messageModal}
          adminKey={adminKey}
          onClose={() => setMessageModal(null)}
          onSent={handleMessageSent}
        />
      )}
      {upgradeModal && (
        <UpgradeModal
          fan={upgradeModal}
          adminKey={adminKey}
          onClose={() => setUpgradeModal(null)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  );
}
