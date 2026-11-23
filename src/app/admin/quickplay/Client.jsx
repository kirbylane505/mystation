'use client';

/**
 * Admin dashboard for /quickplay visitor + play analytics.
 * Protected by ADMIN_KEY (same pattern as other admin pages).
 */

import { useEffect, useState } from 'react';
import { Users, Eye, Play, Star, Globe, Smartphone, ExternalLink, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function QuickPlayStatsPage() {
  const [adminKey, setAdminKey] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('ADMIN_KEY');
      if (stored) setAdminKey(stored);
    }
  }, []);

  const load = async (key) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/quickplay-stats', {
        headers: { 'x-admin-key': key },
      });
      if (res.status === 401) {
        setError('Invalid admin key');
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
      sessionStorage.setItem('ADMIN_KEY', key);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) load(adminKey);
  }, [adminKey]);

  if (!data && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8 flex items-center justify-center">
        <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-2xl font-black mb-2">QuickPlay Stats</h1>
          <p className="text-white/50 text-sm mb-4">Enter admin key to continue</p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(adminKey)}
            placeholder="admin key"
            className="w-full bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white mb-3"
          />
          <button
            onClick={() => load(adminKey)}
            className="w-full bg-[#FFD700] text-black font-black py-3 rounded-lg"
          >
            Load Stats
          </button>
          {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const { summary, playsByTrack, topCountries, byDevice, topReferrers, recent } = data;

  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#0f0a1c] text-white p-6 md:p-10 pb-32">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">QuickPlay Stats</h1>
            <p className="text-white/50 text-sm">Live tracking of mystationlive.com/quickplay</p>
          </div>
          <button
            onClick={() => load(adminKey)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card icon={<Eye className="w-5 h-5" />} label="Page Views" value={summary.pageViews} />
          <Card icon={<Users className="w-5 h-5" />} label="Unique Visitors" value={summary.uniqueVisitors} />
          <Card icon={<Play className="w-5 h-5" />} label="Play-Alls" value={summary.playAlls} />
          <Card icon={<Play className="w-5 h-5" />} label="Total Plays" value={summary.totalPlays} />
        </div>

        {/* Per-track */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#FFD700]" /> Per-Track Performance
          </h2>
          <div className="space-y-3">
            {playsByTrack.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-black/30 rounded-lg p-3">
                <div>
                  <div className="font-bold">{t.title}</div>
                  <div className="text-xs text-white/40">Track ID {t.id}</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-[#FFD700] font-bold">{t.plays} plays</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                    <span className="font-bold">{t.rating.avg}</span>
                    <span className="text-white/40">({t.rating.count})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Countries + Devices */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FFD700]" /> Top Countries
            </h2>
            {topCountries.length === 0 ? (
              <p className="text-white/40 text-sm">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topCountries.map((c) => (
                  <div key={c.code} className="flex justify-between text-sm">
                    <span>{c.code}</span>
                    <span className="text-[#FFD700] font-bold">{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#FFD700]" /> Devices
            </h2>
            <div className="space-y-2">
              {Object.entries(byDevice).map(([d, n]) => (
                <div key={d} className="flex justify-between text-sm">
                  <span className="capitalize">{d}</span>
                  <span className="text-[#FFD700] font-bold">{n}</span>
                </div>
              ))}
              {Object.keys(byDevice).length === 0 && (
                <p className="text-white/40 text-sm">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Referrers */}
        {topReferrers.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#FFD700]" /> Top Referrers
            </h2>
            <div className="space-y-2 text-sm">
              {topReferrers.map((r) => (
                <div key={r.host} className="flex justify-between">
                  <span>{r.host}</span>
                  <span className="text-[#FFD700] font-bold">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent visitors */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="text-lg font-black mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFD700]" /> Recent Visitors (last 100 unique)
          </h2>
          {recent.length === 0 ? (
            <p className="text-white/40 text-sm">No visitors yet. Share the link!</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {recent.map((v, i) => (
                <div key={i} className="bg-black/30 rounded-lg p-3 text-sm">
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[#FFD700] font-bold">
                        {v.city || v.region || v.country || '—'}
                      </span>
                      {v.country && <span className="text-white/40"> · {v.country}</span>}
                      <span className="text-white/40"> · {v.device || 'unknown'}</span>
                    </div>
                    <span className="text-white/40">{fmtTime(v.created_at)}</span>
                  </div>
                  <div className="text-xs text-white/30 mt-1 truncate">
                    {v.ip_prefix} · {v.user_agent}
                  </div>
                  {v.referrer && (
                    <div className="text-xs text-blue-400/60 mt-1 truncate">← {v.referrer}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon, label, value }) {
  return (
    <div className="bg-gradient-to-br from-white/10 to-white/[0.03] border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider font-bold mb-2">
        {icon}
        {label}
      </div>
      <div className="text-3xl font-black text-[#FFD700]">{value}</div>
    </div>
  );
}
