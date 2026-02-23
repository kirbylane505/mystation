/**
 * MYSTATION — Admin Listener Map
 * Real-time US heat map showing active listeners by city/state
 * Admin-only page
 */

'use client';

import { useState, useEffect } from 'react';
import { MapPin, TrendingUp, Users, Flame, Music, RefreshCw } from 'lucide-react';

// US State abbreviation → approximate center coordinates (for SVG positioning)
const STATE_COORDS = {
  AL: [33, 87], AK: [64, 153], AZ: [34, 112], AR: [35, 92], CA: [37, 120],
  CO: [39, 106], CT: [42, 73], DE: [39, 76], FL: [28, 82], GA: [33, 84],
  HI: [20, 156], ID: [44, 114], IL: [40, 89], IN: [40, 86], IA: [42, 93],
  KS: [39, 98], KY: [38, 85], LA: [31, 92], ME: [45, 69], MD: [39, 77],
  MA: [42, 72], MI: [44, 85], MN: [46, 94], MS: [33, 90], MO: [38, 92],
  MT: [47, 110], NE: [41, 100], NV: [39, 117], NH: [44, 72], NJ: [40, 75],
  NM: [35, 106], NY: [43, 76], NC: [36, 80], ND: [47, 100], OH: [40, 83],
  OK: [35, 97], OR: [44, 121], PA: [41, 78], RI: [42, 72], SC: [34, 81],
  SD: [44, 100], TN: [36, 86], TX: [31, 97], UT: [39, 112], VT: [44, 73],
  VA: [37, 79], WA: [47, 121], WV: [39, 80], WI: [44, 90], WY: [43, 108],
};

export default function ListenersPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const key = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('key')
        : null;

      const res = await fetch(`/api/admin/listeners?key=${key}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/50">Loading listener data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  const maxCount = data?.states?.[0]?.count || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <MapPin size={32} className="text-blue-400" />
            Listener Map
          </h1>
          <p className="text-white/50 mt-1">Where your music is playing — last 30 days</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-white/40 text-xs">Total Plays</span>
          </div>
          <span className="text-white font-black text-2xl">{(data?.totalListeners || 0).toLocaleString()}</span>
        </div>

        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-green-400" />
            <span className="text-white/40 text-xs">States</span>
          </div>
          <span className="text-white font-black text-2xl">{data?.states?.length || 0}</span>
        </div>

        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-yellow-400" />
            <span className="text-white/40 text-xs">Cities</span>
          </div>
          <span className="text-white font-black text-2xl">{data?.cities?.length || 0}</span>
        </div>

        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={14} className="text-red-400" />
            <span className="text-white/40 text-xs">#1 State</span>
          </div>
          <span className="text-white font-black text-2xl">{data?.states?.[0]?.state || '—'}</span>
        </div>
      </div>

      {/* US Map (SVG-based heat dots) */}
      <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6 mb-8">
        <h2 className="text-white font-bold mb-4">Active Listener Map</h2>
        <div className="relative w-full" style={{ paddingBottom: '62%' }}>
          <svg
            viewBox="0 0 960 600"
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* US outline (simplified) */}
            <rect x="60" y="50" width="850" height="480" rx="20" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />

            {/* State dots with heat intensity */}
            {data?.states?.map((s) => {
              const coords = STATE_COORDS[s.state];
              if (!coords) return null;

              // Map geo coords to SVG coords (approximate)
              const x = ((coords[1] - 65) / (155 - 65)) * 850 + 60;
              // Flip x since longitude goes west→east but we want left→right
              const svgX = 960 - x;
              const y = ((coords[0] - 25) / (50 - 25)) * 400 + 80;
              // Flip y
              const svgY = 600 - y;

              const intensity = s.count / maxCount;
              const radius = Math.max(8, Math.min(30, intensity * 30 + 5));

              return (
                <g key={s.state}>
                  {/* Glow */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={radius + 5}
                    fill={`rgba(212, 160, 23, ${intensity * 0.3})`}
                  />
                  {/* Dot */}
                  <circle
                    cx={svgX}
                    cy={svgY}
                    r={radius}
                    fill={`rgba(212, 160, 23, ${0.3 + intensity * 0.7})`}
                    stroke="rgba(212, 160, 23, 0.5)"
                    strokeWidth="1"
                  />
                  {/* Label */}
                  <text
                    x={svgX}
                    y={svgY + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {s.state}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Hot Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Cities */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <Flame size={18} className="text-yellow-400" />
            Hot Areas
          </h2>
          <div className="space-y-3">
            {(data?.hotAreas || []).map((area, idx) => (
              <div key={`${area.city}-${area.state}`} className="flex items-center gap-3">
                <span className={`text-sm font-bold w-6 text-center ${
                  idx === 0 ? 'text-yellow-400' :
                  idx === 1 ? 'text-gray-300' :
                  idx === 2 ? 'text-amber-600' :
                  'text-white/30'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <span className="text-white text-sm font-medium">{area.city}, {area.state}</span>
                </div>
                <span className="text-white/60 text-sm font-bold">{area.count} plays</span>
              </div>
            ))}
          </div>
        </div>

        {/* State Breakdown */}
        <div className="bg-white/[0.03] rounded-2xl border border-white/10 p-6">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-blue-400" />
            State Breakdown
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(data?.states || []).map((s) => (
              <div key={s.state} className="flex items-center gap-3">
                <span className="text-white font-bold text-sm w-8">{s.state}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 rounded-full"
                    style={{ width: `${(s.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-white/50 text-xs w-20 text-right">
                  {s.count} plays, {s.cityCount} cities
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Cities Table */}
      <div className="mt-8 bg-white/[0.03] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Music size={18} className="text-purple-400" />
            All Cities ({data?.cities?.length || 0})
          </h2>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="text-white/40 text-xs uppercase tracking-wider sticky top-0 bg-mystation-navy">
              <tr>
                <th className="text-left px-6 py-3">City</th>
                <th className="text-left px-6 py-3">State</th>
                <th className="text-right px-6 py-3">Plays</th>
                <th className="text-right px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {(data?.cities || []).map((city) => (
                <tr key={`${city.city}-${city.state}`} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-6 py-3 text-white text-sm">{city.city}</td>
                  <td className="px-6 py-3 text-white/60 text-sm">{city.state}</td>
                  <td className="px-6 py-3 text-white font-bold text-sm text-right">{city.count}</td>
                  <td className="px-6 py-3 text-white/40 text-xs text-right">
                    {city.lastActive ? new Date(city.lastActive).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
