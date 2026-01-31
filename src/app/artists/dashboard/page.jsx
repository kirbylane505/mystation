/**
 * MYSTATION - Artist Dashboard
 * Manage your station, view analytics, upload music
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Music, Upload, BarChart3, DollarSign, Users, Play,
  Settings, ExternalLink, TrendingUp, Clock, Globe,
  Plus, Edit, Trash2, Eye, Share2, Copy, CheckCircle
} from 'lucide-react';

// Mock data - in production this would come from database
const mockArtistData = {
  name: "Mike Page",
  stationUrl: "mystation.vercel.app",
  cashApp: "$RIDE4PAGEMUSIC847",
  totalPlays: 12847,
  uniqueListeners: 3421,
  totalDonations: 2847.50,
  donationCount: 89,
  tracks: 24,
  joinedDate: "January 2026"
};

const mockAnalytics = {
  last7Days: [
    { day: "Mon", plays: 342 },
    { day: "Tue", plays: 456 },
    { day: "Wed", plays: 523 },
    { day: "Thu", plays: 401 },
    { day: "Fri", plays: 612 },
    { day: "Sat", plays: 789 },
    { day: "Sun", plays: 634 },
  ],
  topTracks: [
    { id: 1, title: "Favorite Person", plays: 2341, trend: "+12%" },
    { id: 2, title: "Very Special", plays: 1892, trend: "+8%" },
    { id: 3, title: "Live Like A King", plays: 1456, trend: "+5%" },
    { id: 4, title: "Doing Me", plays: 1234, trend: "+15%" },
    { id: 5, title: "IDMG 254", plays: 1102, trend: "+3%" },
  ],
  topLocations: [
    { city: "Atlanta, GA", listeners: 892 },
    { city: "Chicago, IL", listeners: 567 },
    { city: "Houston, TX", listeners: 432 },
    { city: "Los Angeles, CA", listeners: 389 },
    { city: "New York, NY", listeners: 345 },
  ],
  deviceBreakdown: {
    mobile: 62,
    desktop: 31,
    tablet: 7
  }
};

export default function ArtistDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${mockArtistData.stationUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    { label: "Total Plays", value: mockArtistData.totalPlays.toLocaleString(), icon: Play, color: "blue" },
    { label: "Unique Listeners", value: mockArtistData.uniqueListeners.toLocaleString(), icon: Users, color: "purple" },
    { label: "Total Donations", value: `$${mockArtistData.totalDonations.toLocaleString()}`, icon: DollarSign, color: "green" },
    { label: "Tracks", value: mockArtistData.tracks, icon: Music, color: "orange" },
  ];

  return (
    <div className="min-h-screen bg-mystation-darker">
      {/* Header */}
      <header className="border-b border-white/10 bg-mystation-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white font-bold text-xl">
              MY<span className="text-blue-400">STATION</span>
            </Link>
            <span className="text-white/30">|</span>
            <span className="text-white/60">Artist Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} className="text-white/60" />}
              <span className="text-white text-sm">{copied ? "Copied!" : "Share Station"}</span>
            </button>
            <a
              href={`https://${mockArtistData.stationUrl}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
            >
              <Eye size={18} className="text-white" />
              <span className="text-white text-sm">View Station</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {mockArtistData.name}</h1>
          <p className="text-white/50">Here's how your station is performing</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={24} className={`text-${stat.color}-400`} />
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          {['overview', 'analytics', 'tracks', 'donations', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Plays - Last 7 Days</h3>
              <div className="flex items-end justify-between h-48 gap-4">
                {mockAnalytics.last7Days.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-400 hover:to-blue-300"
                      style={{ height: `${(day.plays / 800) * 100}%` }}
                    />
                    <p className="text-white/50 text-xs mt-2">{day.day}</p>
                    <p className="text-white text-xs font-medium">{day.plays}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Locations */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe size={20} className="text-blue-400" />
                Top Locations
              </h3>
              <div className="space-y-3">
                {mockAnalytics.topLocations.map((loc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-white/70">{loc.city}</span>
                    <span className="text-white font-medium">{loc.listeners}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tracks */}
            <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Top Performing Tracks</h3>
              <div className="space-y-3">
                {mockAnalytics.topTracks.map((track, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                    <span className="text-white/30 font-bold w-6">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{track.title}</p>
                      <p className="text-white/50 text-sm">{track.plays.toLocaleString()} plays</p>
                    </div>
                    <span className="text-green-400 text-sm font-medium">{track.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="glass rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Devices</h3>
              <div className="space-y-4">
                {Object.entries(mockAnalytics.deviceBreakdown).map(([device, pct]) => (
                  <div key={device}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white/70 capitalize">{device}</span>
                      <span className="text-white font-medium">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracks' && (
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Your Tracks</h3>
              <Link
                href="/artists/dashboard/upload"
                className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition"
              >
                <Plus size={18} />
                <span className="text-white font-medium">Upload Track</span>
              </Link>
            </div>

            <div className="space-y-3">
              {mockAnalytics.topTracks.map((track, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Music size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{track.title}</p>
                    <p className="text-white/50 text-sm">{track.plays.toLocaleString()} plays</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition">
                      <Edit size={18} className="text-white/50" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition">
                      <Trash2 size={18} className="text-red-400/50" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Donations</h3>
                <p className="text-white/50 text-sm">All donations go directly to your CashApp</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-400">${mockArtistData.totalDonations.toLocaleString()}</p>
                <p className="text-white/50 text-sm">{mockArtistData.donationCount} donations</p>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <DollarSign size={24} className="text-green-400" />
                <div>
                  <p className="text-white font-medium">Your CashApp</p>
                  <p className="text-green-400 font-bold">{mockArtistData.cashApp}</p>
                </div>
              </div>
            </div>

            <p className="text-white/40 text-sm text-center">
              Donation history is available in your CashApp app
            </p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Station Settings</h3>

            <div className="space-y-6">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Station Name</label>
                <input
                  type="text"
                  defaultValue={mockArtistData.name}
                  className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">CashApp Username</label>
                <input
                  type="text"
                  defaultValue={mockArtistData.cashApp}
                  className="w-full max-w-md px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-white/60 text-sm mb-2 block">Station URL</label>
                <div className="flex items-center gap-2 max-w-md">
                  <span className="text-white/40">https://</span>
                  <input
                    type="text"
                    defaultValue={mockArtistData.stationUrl}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <button className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-20">
            <BarChart3 size={64} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Full Analytics Coming Soon</h3>
            <p className="text-white/50">Detailed breakdowns, export options, and more</p>
          </div>
        )}
      </div>
    </div>
  );
}
