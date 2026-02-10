/**
 * LOVE ON THE LAWN - Festival Hub
 * Streaming, Countdown, Streamer Program, Live Event
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, MapPin, Users, Video, Star, Crown, Zap,
  Play, Radio, Gift, Trophy, ChevronRight, ExternalLink,
  Mic, Camera, Ticket, Heart, Clock, Flame, ShoppingBag, Sparkles
} from 'lucide-react';

// LOTL Merch Banner — Feature LOTL gear prominently for Year 5
function LOTLMerchBanner() {
  return (
    <Link href="/merch" className="block group">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 p-1">
        <div className="relative bg-black/90 rounded-[22px] p-6 lg:p-8 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 animate-pulse" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-500/30 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/30 to-transparent rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-center gap-6">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
                <Sparkles size={14} className="text-green-400" />
                <span className="text-green-300 text-xs font-black uppercase tracking-wider">LOTL Year 5 Merch</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-black text-white mb-2">
                REP <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">LOVE ON THE LAWN</span>
              </h3>
              <p className="text-white/60 text-sm lg:text-base mb-2">
                Limited edition festival hoodies, tees, hats & more.
              </p>
              <p className="text-green-400 text-sm font-bold mb-4">
                Spend $50+ = 25% OFF tickets | $100+ = FREE ticket
              </p>
              <div className="inline-flex items-center gap-2 text-white font-bold group-hover:gap-3 transition-all">
                <ShoppingBag size={18} className="text-green-400" />
                Shop LOTL Collection
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Right: LOTL Product images */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-green-500/20 overflow-hidden transform -rotate-6 group-hover:rotate-0 transition-transform shadow-xl">
                <img
                  src="/images/mockups/lotl-tee-black.jpg"
                  alt="LOTL Tee"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-green-500/20 overflow-hidden transform rotate-3 group-hover:rotate-0 transition-transform shadow-xl z-10">
                <img
                  src="/images/mockups/lotl-hoodie-black.jpg"
                  alt="LOTL Hoodie"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <div className="hidden lg:block w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-green-500/20 overflow-hidden transform -rotate-3 group-hover:rotate-0 transition-transform shadow-xl">
                <img
                  src="/images/merch/lotl-cap-final.jpg"
                  alt="LOTL Cap"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Festival Date - Update this for each year
const FESTIVAL_DATE = new Date('2026-09-05T14:00:00');

// Countdown Timer Component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  return (
    <div className="flex gap-3 lg:gap-5 justify-center">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hours' },
        { value: timeLeft.minutes, label: 'Mins' },
        { value: timeLeft.seconds, label: 'Secs' },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-2 shadow-xl shadow-green-500/40 border border-green-400/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <span className="text-3xl lg:text-4xl font-black text-white relative">{String(item.value).padStart(2, '0')}</span>
          </div>
          <span className="text-green-400/60 text-xs font-bold uppercase tracking-wider">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Live Stream Card
function StreamCard({ stream, isLive = false }) {
  return (
    <div className="glass rounded-2xl overflow-hidden group hover:border-green-500/30 transition-all">
      <div className="aspect-video relative bg-gradient-to-br from-gray-800 to-gray-900">
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full z-10">
            <span className="w-2 h-2 bg-white rounded-full" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-green-500/20 transition">
            <Play size={32} className="text-white ml-1" />
          </div>
        </div>
        {stream.thumbnail && (
          <img src={stream.thumbnail} alt={stream.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-white font-bold mb-1">{stream.title}</h3>
        <p className="text-white/50 text-sm">{stream.description}</p>
        <div className="flex items-center gap-3 mt-3 text-white/40 text-xs">
          <span className="flex items-center gap-1"><Users size={12} /> {stream.viewers || 0}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {stream.duration || 'Upcoming'}</span>
        </div>
      </div>
    </div>
  );
}

// Streamer Badge Component
function StreamerBadge({ tier }) {
  const tiers = {
    free: { color: 'from-gray-500 to-gray-600', icon: Video, label: 'Streamer' },
    official: { color: 'from-green-500 to-emerald-600', icon: Star, label: 'Official Streamer' },
    pro: { color: 'from-blue-500 to-indigo-600', icon: Zap, label: 'Pro Streamer' },
    partner: { color: 'from-yellow-500 to-amber-600', icon: Crown, label: 'Exclusive Partner' },
    // Legacy support
    vip: { color: 'from-yellow-500 to-amber-600', icon: Crown, label: 'Exclusive Partner' },
    verified: { color: 'from-green-500 to-emerald-600', icon: Star, label: 'Official Streamer' },
  };
  const t = tiers[tier] || tiers.official;
  const Icon = t.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${t.color} rounded-full`}>
      <Icon size={14} className="text-white" />
      <span className="text-white text-xs font-bold">{t.label}</span>
    </div>
  );
}

export default function LOTLPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for streams
  const liveStreams = [
    { id: 1, title: 'Main Stage Live', description: 'Official LOTL broadcast', viewers: 1247, isLive: true },
    { id: 2, title: 'Backstage Access', description: 'Vault members only', viewers: 342, isLive: true },
    { id: 3, title: 'Crowd Cam', description: 'Feel the energy', viewers: 891, isLive: true },
  ];

  const upcomingStreams = [
    { id: 4, title: 'Artist Reveal #3', description: 'Who\'s performing?', duration: 'Tomorrow 7PM' },
    { id: 5, title: 'Setup Day Stream', description: 'Watch the stage come together', duration: 'June 14th' },
    { id: 6, title: 'Merch Drop Preview', description: 'Exclusive LOTL gear', duration: 'Coming Soon' },
  ];

  const featuredStreamers = [
    { name: 'ATLVibes', followers: '45K', tier: 'official', avatar: '🎬' },
    { name: 'ChiTownStreams', followers: '32K', tier: 'vip', avatar: '📹' },
    { name: 'MusicLover404', followers: '18K', tier: 'verified', avatar: '🎤' },
    { name: 'PageNation', followers: '12K', tier: 'verified', avatar: '🔥' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'recaps', label: 'Past Events', icon: Play },
    { id: 'streams', label: 'Live Streams', icon: Video },
    { id: 'streamers', label: 'Streamer Program', icon: Camera },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  // Recap videos from past events
  const recapVideos = [
    {
      id: 1,
      title: 'LOTL 2025 Official Recap',
      year: 2025,
      duration: '4:32',
      views: '12.5K',
      videoUrl: '/videos/lotl-recap-2025.mp4',
      thumbnail: '/videos/lotl-recap-2025-thumb.jpg',
      description: 'Relive the magic of Love on the Lawn 2025 - featuring incredible performances, amazing fans, and unforgettable moments.'
    }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen">
      {/* Hero Section — SUPER LIT */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Multi-layer animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-500/30 via-transparent to-transparent" />
        <div className="bg-orb w-[700px] h-[700px] bg-green-500 top-[-300px] left-[-200px] opacity-40" />
        <div className="bg-orb w-[600px] h-[600px] bg-emerald-400 top-[50px] right-[-200px] opacity-30" style={{ animationDelay: '-3s' }} />
        <div className="bg-orb w-[500px] h-[500px] bg-teal-400 bottom-[-150px] left-[20%] opacity-25" style={{ animationDelay: '-7s' }} />
        <div className="bg-orb w-[300px] h-[300px] bg-yellow-400 top-[200px] left-[60%] opacity-15" style={{ animationDelay: '-5s' }} />

        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        <div className="relative max-w-screen-xl mx-auto px-6 text-center">
          {/* YEAR 5 Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-full mb-8 shadow-lg shadow-green-500/10">
            <Flame size={18} className="text-yellow-400 animate-pulse" />
            <span className="text-green-300 text-sm font-black uppercase tracking-[0.2em]">Year 5 — The Biggest One Yet</span>
            <Flame size={18} className="text-yellow-400 animate-pulse" />
          </div>

          {/* LOTL Logo */}
          <div className="mb-8">
            <img
              src="/images/lotl-logo-2026.png"
              alt="Love on the Lawn Day 2026"
              className="w-80 lg:w-[28rem] mx-auto drop-shadow-[0_0_40px_rgba(34,197,94,0.3)]"
            />
          </div>

          <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 leading-tight">
            <span className="bg-gradient-to-r from-green-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
              5,000+ Fans. One Stage.
            </span>
            <br />
            <span className="text-white">One Legendary Day.</span>
          </h1>

          <p className="text-lg lg:text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Elgin's premier outdoor music festival. Live music, community, food, and culture — all supporting youth music programs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-8 text-white/60 mb-10">
            <span className="flex items-center gap-2 text-lg">
              <Calendar size={20} className="text-green-400" />
              <span className="font-bold text-white">September 5, 2026</span>
            </span>
            <span className="hidden lg:block text-white/20">|</span>
            <span className="flex items-center gap-2 text-lg">
              <MapPin size={20} className="text-green-400" />
              <span className="font-bold text-white">Festival Park, Elgin, IL</span>
            </span>
            <span className="hidden lg:block text-white/20">|</span>
            <span className="flex items-center gap-2 text-lg">
              <Users size={20} className="text-green-400" />
              <span className="font-bold text-white">10,000 Capacity</span>
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-12">
            <p className="text-green-400/60 text-sm font-bold uppercase tracking-widest mb-4">Countdown to Festival Day</p>
            <CountdownTimer targetDate={FESTIVAL_DATE} />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a
              href="https://cash.app/$RIDE4PAGEMUSIC847?note=LOTL%20Ticket"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Ticket size={20} />
              Get Tickets
            </a>
            <Link
              href="/merch"
              className="px-8 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/40 text-yellow-300 font-black text-lg rounded-2xl hover:bg-yellow-500/30 transition-all flex items-center gap-2"
            >
              <ShoppingBag size={20} />
              Shop LOTL Merch
            </Link>
            <button
              onClick={() => setActiveTab('streams')}
              className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Video size={20} />
              Watch Streams
            </button>
          </div>

          {/* Merch deal callout */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <Gift size={14} className="text-yellow-400" />
            <span className="text-yellow-300 text-sm font-bold">Spend $50+ merch = 25% OFF tickets | $100+ = FREE ticket</span>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="sticky top-16 z-40 bg-mystation-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <section className="py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            {/* LOTL Merch Banner — Year 5 Featured */}
            <div className="mb-12">
              <LOTLMerchBanner />
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              {[
                { icon: Users, value: '5K+', label: 'Fans', color: 'from-green-500 to-emerald-600' },
                { icon: Mic, value: 'Live', label: 'Performances', color: 'from-blue-500 to-indigo-600' },
                { icon: Video, value: '5', label: 'Live Streams', color: 'from-purple-500 to-pink-600' },
                { icon: Gift, value: '$50K', label: 'To Youth Programs', color: 'from-orange-500 to-red-600' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="glass rounded-2xl p-6 text-center">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-white/50 text-sm">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Road to LOTL */}
            <div className="glass rounded-3xl p-8 mb-16">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Radio className="text-green-400" />
                Road to LOTL
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { date: 'July 1', title: 'Lineup Announcement', status: 'upcoming', desc: 'Live stream reveal of all artists' },
                  { date: 'July 15', title: 'Early Bird Tickets', status: 'upcoming', desc: 'Limited early access pricing' },
                  { date: 'Aug 15', title: 'Streamer Applications Close', status: 'upcoming', desc: 'Last chance to apply' },
                  { date: 'Sept 4', title: 'Setup Day Stream', status: 'upcoming', desc: 'Watch the stage come together' },
                  { date: 'Sept 5', title: 'LOTL 2026', status: 'upcoming', desc: 'The main event' },
                  { date: 'Sept 6', title: 'Vault Content Drop', status: 'upcoming', desc: 'Full sets for 90-day members' },
                ].map((event, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                    <p className="text-green-400 text-sm font-bold mb-1">{event.date}</p>
                    <h3 className="text-white font-semibold mb-1">{event.title}</h3>
                    <p className="text-white/40 text-sm">{event.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Streamers Preview */}
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Camera className="text-green-400" />
                  Featured Streamers
                </h2>
                <button
                  onClick={() => setActiveTab('streamers')}
                  className="text-green-400 text-sm font-medium flex items-center gap-1 hover:underline"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                {featuredStreamers.map((streamer, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 text-center hover:bg-white/10 transition">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                      {streamer.avatar}
                    </div>
                    <h3 className="text-white font-bold mb-1">{streamer.name}</h3>
                    <p className="text-white/40 text-sm mb-2">{streamer.followers} followers</p>
                    <StreamerBadge tier={streamer.tier} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recaps Tab - Past Events */}
      {activeTab === 'recaps' && (
        <section className="py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-white mb-4">
                Relive the <span className="text-green-400">Magic</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Watch recap videos from past Love on the Lawn events. See what you're in for in 2026!
              </p>
            </div>

            {/* Featured Recap */}
            <div className="glass rounded-3xl overflow-hidden mb-12">
              <div className="aspect-video relative bg-black">
                <video
                  controls
                  poster={recapVideos[0].thumbnail}
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  <source src={recapVideos[0].videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold">
                    {recapVideos[0].year}
                  </span>
                  <span className="text-white/40 text-sm flex items-center gap-1">
                    <Play size={14} /> {recapVideos[0].views} views
                  </span>
                  <span className="text-white/40 text-sm flex items-center gap-1">
                    <Clock size={14} /> {recapVideos[0].duration}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{recapVideos[0].title}</h3>
                <p className="text-white/60">{recapVideos[0].description}</p>
              </div>
            </div>

            {/* Past Event Highlights */}
            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="text-yellow-400" />
                LOTL 2025 Highlights
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { icon: Users, value: '8,500+', label: 'Attendees' },
                  { icon: Mic, value: '12', label: 'Artists' },
                  { icon: Heart, value: '$35K', label: 'Raised for Youth' },
                  { icon: Video, value: '50K+', label: 'Stream Views' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="text-center p-4 rounded-xl bg-white/5">
                      <Icon size={28} className="text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-black text-white">{stat.value}</p>
                      <p className="text-white/50 text-sm">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <p className="text-white/60 mb-4">Ready to be part of the next one?</p>
              <a
                href="https://cash.app/$RIDE4PAGEMUSIC847?note=LOTL%20Ticket"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary bg-gradient-to-r from-green-500 to-emerald-600 inline-flex items-center gap-2"
              >
                <Ticket size={18} />
                Get LOTL 2026 Tickets
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Streams Tab */}
      {activeTab === 'streams' && (
        <section id="streams" className="py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            {/* Live Now */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                Live Now
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {liveStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive={true} />
                ))}
              </div>
            </div>

            {/* Upcoming Streams */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Clock className="text-green-400" />
                Upcoming Streams
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {upcomingStreams.map((stream) => (
                  <StreamCard key={stream.id} stream={stream} isLive={false} />
                ))}
              </div>
            </div>

            {/* Stream Schedule */}
            <div className="mt-12 glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Event Day Stream Schedule</h2>
              <div className="space-y-4">
                {[
                  { time: '2:00 PM', title: 'Gates Open - Crowd Cam Live', type: 'Free' },
                  { time: '3:00 PM', title: 'Opening Acts Begin', type: 'Free' },
                  { time: '5:00 PM', title: 'Main Stage Headliners', type: 'Free' },
                  { time: '6:00 PM', title: 'Backstage Exclusive', type: 'Vault Only' },
                  { time: '8:00 PM', title: 'Mike Page Set', type: 'Free' },
                  { time: '9:00 PM', title: 'After Party Stream', type: 'Vault Only' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                    <span className="text-green-400 font-mono font-bold w-24">{item.time}</span>
                    <span className="text-white flex-1">{item.title}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.type === 'Vault Only'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Streamer Program Tab */}
      {activeTab === 'streamers' && (
        <section id="streamers" className="py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            {/* Apply Section */}
            <div className="glass rounded-3xl p-8 mb-12 bg-gradient-to-br from-green-500/10 to-emerald-500/5">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-black text-white mb-4">
                    Become an Official<br />
                    <span className="text-green-400">LOTL Streamer</span>
                  </h2>
                  <p className="text-white/60 mb-6">
                    Stream Love on the Lawn to your audience. Get official credentials, backstage access,
                    and help us share the love with the world.
                  </p>
                  <ul className="space-y-3 mb-6">
                    {[
                      'Official LOTL Streamer credentials',
                      'Creator Lounge with dedicated WiFi',
                      'Promo kit with graphics & assets',
                      'Listed on official streamer page',
                      'Loyalty points for your followers',
                    ].map((perk, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/80">
                        <Star size={16} className="text-green-400" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:idmgatl@gmail.com?subject=LOTL%20Streamer%20Application"
                    className="btn-primary bg-gradient-to-r from-green-500 to-emerald-600 inline-flex items-center gap-2"
                  >
                    <Camera size={18} />
                    Apply Now
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Video, title: 'Stream', desc: 'Your Platform' },
                    { icon: Heart, title: 'Share', desc: 'The Experience' },
                    { icon: Mic, title: 'Access', desc: 'Exclusive Content' },
                    { icon: Users, title: 'Grow', desc: 'Your Audience' },
                  ].map((req, i) => {
                    const Icon = req.icon;
                    return (
                      <div key={i} className="glass rounded-xl p-4 text-center">
                        <Icon size={24} className="text-green-400 mx-auto mb-2" />
                        <p className="text-white font-bold">{req.title}</p>
                        <p className="text-white/40 text-sm">{req.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Streamer Pricing Tiers */}
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Ticket className="text-green-400" />
              Streamer Packages
            </h2>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                {
                  tier: 'free',
                  title: 'Free Streamer',
                  price: '$0',
                  color: 'from-gray-500 to-gray-600',
                  perks: ['Stream from audience', 'Use #LOTL hashtag', 'No official badge', 'General admission'],
                  cta: 'Just Show Up'
                },
                {
                  tier: 'official',
                  title: 'Official Streamer',
                  price: '$50',
                  color: 'from-green-500 to-emerald-600',
                  popular: true,
                  perks: ['Official LOTL badge', 'Backstage B-roll access', 'Listed on website', 'Promo kit included', 'Creator Lounge WiFi'],
                  cta: 'Apply Now'
                },
                {
                  tier: 'pro',
                  title: 'Pro Streamer',
                  price: '$150',
                  color: 'from-blue-500 to-indigo-600',
                  perks: ['All Official perks', 'Press pit access', 'Artist interview slots', 'Featured placement', 'Priority support'],
                  cta: 'Go Pro'
                },
                {
                  tier: 'partner',
                  title: 'Exclusive Partner',
                  price: '$500',
                  color: 'from-yellow-500 to-amber-600',
                  perks: ['All Pro perks', 'Dedicated stream booth', 'Direct artist access', '10% revenue share', 'Year-round content rights', 'VIP suite access'],
                  cta: 'Partner Up'
                },
              ].map((level, i) => (
                <div key={i} className={`glass rounded-2xl p-6 relative ${level.popular ? 'border-green-500/50 ring-2 ring-green-500/20' : ''}`}>
                  {level.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 rounded-full text-white text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${level.color} rounded-full mb-4`}>
                    <Star size={14} className="text-white" />
                    <span className="text-white text-xs font-bold">{level.title}</span>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-white">{level.price}</span>
                    {level.price !== '$0' && <span className="text-white/40 text-sm ml-1">one-time</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {level.perks.map((perk, j) => (
                      <li key={j} className="flex items-center gap-2 text-white/70 text-sm">
                        <Star size={12} className="text-green-400 shrink-0" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={level.price === '$0' ? '#' : 'mailto:idmgatl@gmail.com?subject=LOTL%20Streamer%20-%20' + level.title}
                    className={`block w-full py-3 rounded-xl text-center font-bold text-sm transition ${
                      level.popular
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {level.cta}
                  </a>
                </div>
              ))}
            </div>

            {/* What Happens When You Apply */}
            <div className="glass rounded-2xl p-6 mb-6 border-green-500/20 bg-green-500/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Zap className="text-green-400" size={20} />
                When You Apply
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Submit', desc: 'Email us your info & social handles' },
                  { step: '2', title: 'Review', desc: 'We review within 48 hours' },
                  { step: '3', title: 'Payment', desc: 'Pay via CashApp if approved' },
                  { step: '4', title: 'Access', desc: 'Get credentials & promo kit' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-3 rounded-xl bg-white/5">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <p className="text-white font-semibold text-sm">{item.title}</p>
                    <p className="text-white/40 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Influencer Note */}
            <div className="glass rounded-2xl p-6 mb-12 border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Crown className="text-yellow-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Got 10K+ Followers?</h3>
                  <p className="text-white/60 text-sm">
                    We offer <span className="text-yellow-400 font-semibold">5-10 complimentary Official Streamer spots</span> for
                    influencers with 10,000+ engaged followers. Your audience = our exposure. Apply with your handles and we'll review.
                  </p>
                </div>
              </div>
            </div>

            {/* All Streamers */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Official Streamers</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {[...featuredStreamers, ...featuredStreamers].map((streamer, i) => (
                  <div key={i} className="glass rounded-xl p-4 text-center hover:border-green-500/30 transition">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                      {streamer.avatar}
                    </div>
                    <h3 className="text-white font-bold mb-1">{streamer.name}</h3>
                    <p className="text-white/40 text-sm mb-2">{streamer.followers} followers</p>
                    <StreamerBadge tier={streamer.tier} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <section className="py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Trophy className="text-yellow-400" />
                LOTL Chat Leaderboard
              </h2>
              <p className="text-white/50 mb-8">
                Most active chatters during LOTL streams earn bonus loyalty points and exclusive rewards!
              </p>

              <div className="space-y-3">
                {[
                  { rank: 1, name: 'BIGFAN847', messages: 1247, points: 5000, badge: '👑' },
                  { rank: 2, name: 'PageNation', messages: 1089, points: 4200, badge: '🥈' },
                  { rank: 3, name: 'LOTLLover', messages: 956, points: 3800, badge: '🥉' },
                  { rank: 4, name: 'ChiTownVibes', messages: 823, points: 3200, badge: '🔥' },
                  { rank: 5, name: 'MusicHead404', messages: 712, points: 2800, badge: '⭐' },
                  { rank: 6, name: 'StreamQueen', messages: 654, points: 2500, badge: '✨' },
                  { rank: 7, name: 'ATLRider', messages: 598, points: 2200, badge: '💎' },
                  { rank: 8, name: 'VaultMember1', messages: 534, points: 1900, badge: '🎵' },
                  { rank: 9, name: 'DreamzFan', messages: 487, points: 1600, badge: '🎤' },
                  { rank: 10, name: 'FoundationFam', messages: 423, points: 1400, badge: '💪' },
                ].map((user, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-4 rounded-xl transition ${
                      user.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                      user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      user.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {user.rank}
                    </div>
                    <span className="text-2xl">{user.badge}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-white/40 text-sm">{user.messages.toLocaleString()} messages</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{user.points.toLocaleString()}</p>
                      <p className="text-white/40 text-xs">points earned</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h3 className="text-green-400 font-bold mb-2">Rewards for Top Chatters</h3>
                <ul className="grid md:grid-cols-3 gap-4 text-white/70 text-sm">
                  <li className="flex items-center gap-2"><Crown className="text-yellow-400" size={16} /> #1: Free LOTL 2027 VIP</li>
                  <li className="flex items-center gap-2"><Star className="text-gray-300" size={16} /> #2-3: Free LOTL 2027 GA</li>
                  <li className="flex items-center gap-2"><Gift className="text-amber-600" size={16} /> #4-10: Exclusive Merch</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* LOTL Merch Spotlight — Push merch before CTA */}
      <section className="py-12">
        <div className="max-w-screen-xl mx-auto px-6">
          <LOTLMerchBanner />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="relative rounded-3xl p-10 lg:p-16 text-center overflow-hidden border border-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-black" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-green-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
                <Flame size={14} className="text-yellow-400" />
                <span className="text-green-400 text-xs font-black uppercase tracking-wider">Year 5 — September 5, 2026</span>
              </div>
              <h2 className="text-3xl lg:text-5xl font-black text-white mb-4">
                Don't Miss <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">LOTL 2026</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                5,000+ fans. One legendary day. All proceeds support youth music programs
                through the Mike Page Foundation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://cash.app/$RIDE4PAGEMUSIC847?note=LOTL%20Ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Ticket size={18} />
                  Get Tickets
                </a>
                <Link href="/merch" className="px-8 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 text-yellow-300 font-black rounded-2xl hover:bg-yellow-500/30 transition-all flex items-center gap-2">
                  <ShoppingBag size={18} />
                  Shop LOTL Merch
                </Link>
                <Link href="/fan-zone" className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition flex items-center gap-2">
                  <Heart size={18} />
                  Join Fan Zone
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
