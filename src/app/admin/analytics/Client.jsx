/**
 * MYSTATION - Admin Analytics Dashboard (Deep Analytics)
 * 5 sections: Revenue, Listener Intelligence, Deep Location, Device Intelligence, Real-Time Feed
 * Protected: requires ADMIN_KEY query param
 */

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Users, Play, Eye, DollarSign, MapPin, Smartphone, Clock,
  RefreshCw, TrendingUp, Globe, Monitor, Zap, Radio, Activity
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={18} className={color} />
        <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Icon size={18} className={color} /> {title}
      </h3>
      {children}
    </div>
  );
}

function ProgressBar({ label, value, total, color = 'from-indigo-500 to-purple-500' }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-white/70 text-sm">{label}</span>
        <span className="text-white/50 text-sm">{value} ({pct}%)</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatMoney(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EVENT_COLORS = {
  play: 'text-green-400',
  page_view: 'text-blue-400',
  purchase: 'text-yellow-400',
};

const EVENT_ICONS = {
  play: Play,
  page_view: Eye,
  purchase: DollarSign,
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [deep, setDeep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deepLoading, setDeepLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (key) {
      setAuthorized(true);
      fetchData('24h');
      fetchDeep();
    } else {
      setLoading(false);
      setDeepLoading(false);
    }
  }, []);

  const fetchData = async (p) => {
    setLoading(true);
    try {
      const adminKey = new URLSearchParams(window.location.search).get('key');
      const res = await fetch(`/api/admin/analytics?period=${p}&key=${adminKey}`);
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchDeep = async () => {
    setDeepLoading(true);
    try {
      const adminKey = new URLSearchParams(window.location.search).get('key');
      const res = await fetch(`/api/admin/deep-analytics?key=${adminKey}`);
      if (res.ok) setDeep(await res.json());
    } catch {} finally { setDeepLoading(false); }
  };

  const handleRefresh = () => { fetchData(period); fetchDeep(); };
  const handlePeriod = (p) => { setPeriod(p); fetchData(p); };

  if (!authorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 size={48} className="text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Only</h1>
          <p className="text-white/50">This page requires admin access.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'listeners', label: 'Listeners', icon: Users },
    { id: 'location', label: 'Location', icon: Globe },
    { id: 'devices', label: 'Devices', icon: Monitor },
    { id: 'feed', label: 'Live Feed', icon: Activity },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white">Deep Analytics</h1>
            <p className="text-white/50 text-sm">MyStation Intelligence Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {['24h', '7d', '30d'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  period === p ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
            <button onClick={handleRefresh} className="p-2 bg-white/10 rounded-lg text-white/60 hover:text-white transition">
              <RefreshCw size={16} className={loading || deepLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <div className="text-center py-20">
            <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white/50">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* ========== OVERVIEW TAB ========== */}
            {activeTab === 'overview' && data && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard icon={Play} label="Plays" value={data.totalPlays || 0} color="text-green-400" />
                  <StatCard icon={Users} label="Listeners" value={data.uniqueListeners || 0} color="text-blue-400" />
                  <StatCard icon={Eye} label="Page Views" value={data.totalPageViews || 0} color="text-purple-400" />
                  <StatCard icon={DollarSign} label="Revenue" value={formatMoney(data.totalRevenue || 0)} color="text-yellow-400" />
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {data.topTracks?.length > 0 && (
                    <SectionCard icon={TrendingUp} title="Top Tracks" color="text-green-400">
                      <div className="space-y-3">
                        {data.topTracks.map((t, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-white/30 text-sm w-6 text-right">{i + 1}</span>
                            <p className="text-white text-sm truncate flex-1 min-w-0">{t.title}</p>
                            <span className="text-green-400 font-bold text-sm">{t.count}</span>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {data.peakHours?.length > 0 && (
                    <SectionCard icon={Clock} title="Peak Hours (EST)" color="text-yellow-400">
                      <div className="flex flex-wrap gap-2">
                        {data.peakHours.map((h, i) => (
                          <div key={i} className="px-4 py-2 bg-white/5 rounded-xl text-center">
                            <p className="text-white text-sm font-bold">{h.hour}</p>
                            <p className="text-yellow-400 text-xs">{h.count} events</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              </>
            )}

            {/* ========== REVENUE TAB ========== */}
            {activeTab === 'revenue' && (
              deepLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-yellow-400 mx-auto mb-4" />
                  <p className="text-white/50">Loading Stripe data...</p>
                </div>
              ) : deep?.revenue ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={DollarSign} label="All-Time Revenue" value={formatMoney(deep.revenue.allTimeTotal || 0)} color="text-yellow-400" />
                    <StatCard icon={DollarSign} label="Stripe Balance" value={formatMoney(deep.revenue.balance || 0)} color="text-green-400" />
                    <StatCard icon={Users} label="Subscribers" value={deep.subscriberCount || 0} color="text-blue-400" />
                  </div>

                  <SectionCard icon={DollarSign} title="Revenue Breakdown (Last 100 Charges)" color="text-yellow-400">
                    <div className="space-y-4">
                      {Object.entries(deep.revenue.byType || {}).filter(([_, v]) => v.count > 0).sort((a, b) => b[1].total - a[1].total).map(([type, info]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div>
                            <p className="text-white font-medium capitalize">{type}</p>
                            <p className="text-white/40 text-xs">{info.count} transaction{info.count !== 1 ? 's' : ''}</p>
                          </div>
                          <p className="text-yellow-400 font-black text-lg">{formatMoney(info.total)}</p>
                        </div>
                      ))}
                      {Object.values(deep.revenue.byType || {}).every(v => v.count === 0) && (
                        <p className="text-white/40 text-center py-4">No charges found</p>
                      )}
                    </div>
                  </SectionCard>
                </>
              ) : (
                <p className="text-center text-white/50 py-20">Revenue data unavailable</p>
              )
            )}

            {/* ========== LISTENERS TAB ========== */}
            {activeTab === 'listeners' && (
              deepLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-white/50">Analyzing listeners...</p>
                </div>
              ) : deep?.listeners ? (
                <SectionCard icon={Users} title={`Top Listeners (${deep.listeners.length} unique)`} color="text-blue-400">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs uppercase border-b border-white/10">
                          <th className="text-left py-2 pr-4">#</th>
                          <th className="text-left py-2 pr-4">Listener</th>
                          <th className="text-left py-2 pr-4">Plays</th>
                          <th className="text-left py-2 pr-4 hidden sm:table-cell">Last Track</th>
                          <th className="text-left py-2 pr-4 hidden md:table-cell">Location</th>
                          <th className="text-left py-2 hidden lg:table-cell">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deep.listeners.map((l, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-2.5 pr-4 text-white/30">{i + 1}</td>
                            <td className="py-2.5 pr-4 text-white font-mono text-xs">{l.ipHash}</td>
                            <td className="py-2.5 pr-4 text-blue-400 font-bold">{l.plays}</td>
                            <td className="py-2.5 pr-4 text-white/60 truncate max-w-[200px] hidden sm:table-cell">{l.lastTrack || '—'}</td>
                            <td className="py-2.5 pr-4 text-white/40 hidden md:table-cell">{l.city || '—'}</td>
                            <td className="py-2.5 text-white/30 hidden lg:table-cell">{l.lastTime ? timeAgo(l.lastTime) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>
              ) : (
                <p className="text-center text-white/50 py-20">No listener data</p>
              )
            )}

            {/* ========== LOCATION TAB ========== */}
            {activeTab === 'location' && (
              deepLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-white/50">Mapping locations...</p>
                </div>
              ) : deep?.location ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  <SectionCard icon={MapPin} title="Top 25 Cities" color="text-blue-400">
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                      {deep.location.topCities.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-white/30 text-sm w-6 text-right">{i + 1}</span>
                          <p className="text-white/70 text-sm truncate flex-1 min-w-0">{c.city}</p>
                          <span className="text-blue-400 font-bold text-sm">{c.count}</span>
                        </div>
                      ))}
                      {deep.location.topCities.length === 0 && <p className="text-white/40 text-center py-4">No city data</p>}
                    </div>
                  </SectionCard>

                  <div className="space-y-6">
                    <SectionCard icon={Globe} title="Top States/Regions" color="text-purple-400">
                      <div className="space-y-3">
                        {deep.location.topStates.map((s, i) => (
                          <ProgressBar key={i} label={s.state} value={s.count} total={deep.location.totalLocations} color="from-purple-500 to-pink-500" />
                        ))}
                        {deep.location.topStates.length === 0 && <p className="text-white/40 text-center py-4">No state data</p>}
                      </div>
                    </SectionCard>

                    <SectionCard icon={Globe} title="Top Countries" color="text-green-400">
                      <div className="space-y-3">
                        {deep.location.topCountries.map((c, i) => (
                          <ProgressBar key={i} label={c.country} value={c.count} total={deep.location.totalLocations} color="from-green-500 to-emerald-500" />
                        ))}
                        {deep.location.topCountries.length === 0 && <p className="text-white/40 text-center py-4">No country data</p>}
                      </div>
                    </SectionCard>
                  </div>
                </div>
              ) : (
                <p className="text-center text-white/50 py-20">No location data</p>
              )
            )}

            {/* ========== DEVICES TAB ========== */}
            {activeTab === 'devices' && (
              deepLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-purple-400 mx-auto mb-4" />
                  <p className="text-white/50">Analyzing devices...</p>
                </div>
              ) : deep?.devices ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={Smartphone} label="Total Scanned" value={deep.devices.totalScanned} color="text-purple-400" />
                    <StatCard icon={Radio} label="PWA Users" value={deep.devices.pwaCount} color="text-green-400" />
                    <StatCard icon={Zap} label="CarPlay" value={deep.devices.carplayCount} color="text-yellow-400" />
                    <StatCard icon={Users} label="Subscribers" value={deep.subscriberCount || 0} color="text-blue-400" />
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <SectionCard icon={Globe} title="Browsers" color="text-blue-400">
                      <div className="space-y-3">
                        {deep.devices.topBrowsers.map((b, i) => (
                          <ProgressBar key={i} label={b.name} value={b.count} total={deep.devices.totalScanned} color="from-blue-500 to-cyan-500" />
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard icon={Monitor} title="Operating Systems" color="text-purple-400">
                      <div className="space-y-3">
                        {deep.devices.topOS.map((o, i) => (
                          <ProgressBar key={i} label={o.name} value={o.count} total={deep.devices.totalScanned} color="from-purple-500 to-pink-500" />
                        ))}
                      </div>
                    </SectionCard>

                    <SectionCard icon={Smartphone} title="Device Models" color="text-green-400">
                      <div className="space-y-3">
                        {deep.devices.topModels.length > 0 ? deep.devices.topModels.map((m, i) => (
                          <ProgressBar key={i} label={m.name} value={m.count} total={deep.devices.totalScanned} color="from-green-500 to-emerald-500" />
                        )) : (
                          <p className="text-white/40 text-center py-4">No model data detected</p>
                        )}
                      </div>
                    </SectionCard>
                  </div>
                </>
              ) : (
                <p className="text-center text-white/50 py-20">No device data</p>
              )
            )}

            {/* ========== LIVE FEED TAB ========== */}
            {activeTab === 'feed' && (
              deepLoading ? (
                <div className="text-center py-20">
                  <RefreshCw size={32} className="animate-spin text-green-400 mx-auto mb-4" />
                  <p className="text-white/50">Loading feed...</p>
                </div>
              ) : deep?.feed ? (
                <SectionCard icon={Activity} title="Real-Time Event Feed (Last 50)" color="text-green-400">
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {deep.feed.map((e, i) => {
                      const Icon = EVENT_ICONS[e.type] || Eye;
                      const color = EVENT_COLORS[e.type] || 'text-white/50';
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                          <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-sm font-medium capitalize ${color}`}>{e.type.replace('_', ' ')}</span>
                              {e.track && <span className="text-white text-sm truncate">- {e.track}</span>}
                              {e.page && !e.track && <span className="text-white/60 text-sm truncate">{e.page}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                              {e.location && <span>{e.location}</span>}
                              {e.browser && <span>{e.browser}/{e.os}</span>}
                              {e.isPWA && <span className="text-green-400/60">PWA</span>}
                            </div>
                          </div>
                          <span className="text-white/30 text-xs whitespace-nowrap shrink-0">{timeAgo(e.time)}</span>
                        </div>
                      );
                    })}
                    {deep.feed.length === 0 && <p className="text-white/40 text-center py-8">No events yet</p>}
                  </div>
                </SectionCard>
              ) : (
                <p className="text-center text-white/50 py-20">No feed data</p>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
