/**
 * MYSTATION - Admin Analytics Dashboard
 * In-app analytics for admin viewing
 * Protected: requires ADMIN_KEY query param
 */

'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Play, Eye, DollarSign, MapPin, Smartphone, Clock, RefreshCw, TrendingUp } from 'lucide-react';

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

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('24h');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Simple admin check — look for admin_key in URL
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');
    if (key) {
      setAuthorized(true);
      fetchData('24h');
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async (p) => {
    setLoading(true);
    try {
      const adminKey = new URLSearchParams(window.location.search).get('key');
      const res = await fetch(`/api/admin/analytics?period=${p}&key=${adminKey}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      // Analytics fetch failed — silently handled
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchData(period);
  const handlePeriod = (p) => {
    setPeriod(p);
    fetchData(p);
  };

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

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Analytics</h1>
            <p className="text-white/50 text-sm">MyStation performance dashboard</p>
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
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="text-center py-20">
            <RefreshCw size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white/50">Loading analytics...</p>
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Play} label="Plays" value={data.totalPlays || 0} color="text-green-400" />
              <StatCard icon={Users} label="Listeners" value={data.uniqueListeners || 0} color="text-blue-400" />
              <StatCard icon={Eye} label="Page Views" value={data.totalPageViews || 0} color="text-purple-400" />
              <StatCard icon={DollarSign} label="Revenue" value={`$${((data.totalRevenue || 0) / 100).toFixed(2)}`} color="text-yellow-400" />
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Tracks */}
              {data.topTracks?.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-green-400" /> Top Tracks
                  </h3>
                  <div className="space-y-3">
                    {data.topTracks.map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-white/30 text-sm w-6 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{t.title}</p>
                        </div>
                        <span className="text-green-400 font-bold text-sm">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Locations */}
              {data.topLocations?.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-blue-400" /> Top Locations
                  </h3>
                  <div className="space-y-2">
                    {data.topLocations.slice(0, 15).map((l, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-white/30 text-sm w-6 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 text-sm truncate">{l.location}</p>
                        </div>
                        <span className="text-blue-400 font-bold text-sm">{l.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device Breakdown */}
              {data.deviceCounts && (
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Smartphone size={18} className="text-purple-400" /> Devices
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(data.deviceCounts).filter(([_, v]) => v > 0).map(([device, count]) => {
                      const total = Object.values(data.deviceCounts).reduce((s, v) => s + v, 0);
                      const pct = total ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={device}>
                          <div className="flex justify-between mb-1">
                            <span className="text-white/70 text-sm capitalize">{device}</span>
                            <span className="text-white/50 text-sm">{pct}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Peak Hours */}
              {data.peakHours?.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-yellow-400" /> Peak Hours (EST)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.peakHours.map((h, i) => (
                      <div key={i} className="px-4 py-2 bg-white/5 rounded-xl text-center">
                        <p className="text-white text-sm font-bold">{h.hour}</p>
                        <p className="text-yellow-400 text-xs">{h.count} events</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center text-white/50 py-20">No data available</p>
        )}
      </div>
    </div>
  );
}
