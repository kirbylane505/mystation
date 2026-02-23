/**
 * MYTICKETSLIVE - Events Hub
 * High-energy events page with LOTL hero, upcoming events, merch marquee, and CTA
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, MapPin, Ticket, Clock, Loader2, Filter,
  Music, Heart, Sparkles, ChevronRight, Users,
  ShoppingBag, Flame
} from 'lucide-react';

// Format date nicely: "Sat, Sep 5, 2026"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Get lowest price from ticket_types
function getStartingPrice(ticketTypes) {
  if (!ticketTypes || ticketTypes.length === 0) return null;
  const prices = ticketTypes
    .map(tt => tt.price)
    .filter(p => p > 0);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

// Placeholder gradient when no cover image
function EventImagePlaceholder({ name }) {
  const gradients = [
    'from-blue-600 via-blue-700 to-indigo-800',
    'from-purple-600 via-purple-700 to-indigo-800',
    'from-emerald-600 via-emerald-700 to-teal-800',
    'from-orange-600 via-red-600 to-pink-700',
    'from-cyan-600 via-blue-600 to-indigo-700',
  ];
  const idx = (name || '').length % gradients.length;
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${gradients[idx]} flex items-center justify-center`}>
      <div className="text-center">
        <Ticket size={48} className="text-white/20 mx-auto mb-2" />
        <p className="text-white/30 text-sm font-bold uppercase tracking-wider">
          {name?.split(' ').slice(0, 2).join(' ') || 'Event'}
        </p>
      </div>
    </div>
  );
}

// Single Event Card
function EventCard({ event }) {
  const startingPrice = getStartingPrice(event.ticket_types);
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const daysUntil = Math.max(0, Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <div className="glass rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10">
        {/* Image */}
        <div className="aspect-[16/10] relative overflow-hidden">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              alt={event.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
            />
          ) : null}
          <EventImagePlaceholder name={event.name} />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Date badge */}
          <div className="absolute top-4 left-4 glass rounded-xl px-3 py-2 text-center min-w-[60px]">
            <p className="text-blue-400 text-xs font-bold uppercase">
              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
            </p>
            <p className="text-white text-xl font-black leading-tight">
              {eventDate.getDate()}
            </p>
          </div>

          {/* Status badge */}
          {isPast ? (
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 rounded-full">
              <span className="text-white/50 text-xs font-bold">PAST EVENT</span>
            </div>
          ) : daysUntil <= 7 ? (
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/90 rounded-full">
              <span className="text-white text-xs font-bold">
                {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil} DAYS LEFT`}
              </span>
            </div>
          ) : null}

          {/* Organization badge */}
          {event.organization && (
            <div className="absolute bottom-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                event.organization === 'LOTL' ? 'bg-green-500/90 text-white' :
                event.organization === 'IDMG' ? 'bg-blue-500/90 text-white' :
                event.organization === 'Foundation' ? 'bg-purple-500/90 text-white' :
                'bg-white/20 text-white'
              }`}>
                {event.organization}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
            {event.name}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Calendar size={14} className="text-blue-400 shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.venue && (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <MapPin size={14} className="text-blue-400 shrink-0" />
                <span className="line-clamp-1">
                  {event.venue}{event.city ? `, ${event.city}` : ''}{event.state ? `, ${event.state}` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {startingPrice !== null ? (
              <div>
                <span className="text-white/40 text-xs">From</span>
                <span className="text-white font-black text-xl ml-1.5">
                  ${startingPrice}
                </span>
              </div>
            ) : (
              <span className="text-white/40 text-sm">Pricing TBA</span>
            )}

            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white text-sm font-bold group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
              <Ticket size={14} />
              GET TICKETS
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Skeleton loader
function EventCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="aspect-[16/10] bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/10 rounded w-3/4" />
        <div className="h-4 bg-white/5 rounded w-1/2" />
        <div className="h-4 bg-white/5 rounded w-2/3" />
        <div className="flex items-center justify-between">
          <div className="h-7 bg-white/10 rounded w-16" />
          <div className="h-10 bg-white/10 rounded-full w-32" />
        </div>
      </div>
    </div>
  );
}

// ─── MERCH MARQUEE (Inline scrolling section) ────────────────────
function MerchMarquee() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchMerch() {
      try {
        const [pfRes, pyRes] = await Promise.allSettled([
          fetch('/api/printful/products').then(r => r.json()),
          fetch('/api/printify/products').then(r => r.json()),
        ]);

        let allItems = [];

        // Printify — real product photos
        if (pyRes.status === 'fulfilled' && pyRes.value?.products) {
          allItems.push(...pyRes.value.products.map(p => ({
            id: `py-${p.id}`,
            name: p.title || p.name,
            price: p.price || (p.variants?.[0]?.price ? `$${(p.variants[0].price / 100).toFixed(0)}` : null),
            image: (p.images?.find(i => i.is_default) || p.images?.[0])?.src || p.thumbnail_url,
            slug: (p.title || p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          })).filter(p => p.image));
        }

        // Printful — only items with real mockup images
        if (pfRes.status === 'fulfilled' && pfRes.value?.products) {
          allItems.push(...pfRes.value.products.map(p => ({
            id: `pf-${p.id}`,
            name: p.name,
            price: p.price || p.retail_price,
            image: p.thumbnail_url || p.image,
            slug: (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          })).filter(p => p.image && !p.image.includes('idmg-the-label') && !p.image.includes('idmg-logo-white') && !p.image.includes('mpf-logo') && !p.image.includes('lotl-logo') && !p.image.includes('idmg-logo')));
        }

        // Deduplicate: one per product type (ignore brand/color)
        const seen = new Set();
        const unique = [];
        const typeWords = ['slides', 'socks', 'tee', 'hoodie', 'cap', 'snapback', 'skully', 'backpack', 'tote', 'fanny', 'bottle', 'leggings', 'shorts', 'tank', 'jacket', 'joggers', 'crop', 'bucket', 'polo', 'bag', 'poster', 'bra', 'towel', 'mat', 'flip flop', 'bandana', 'wallet', 'sticker', 'art', 'mug'];
        for (const item of allItems) {
          const lower = item.name.toLowerCase();
          const type = typeWords.find(t => lower.includes(t)) || lower;
          if (!seen.has(type)) {
            seen.add(type);
            unique.push(item);
          }
        }

        setProducts(unique.slice(0, 12));
      } catch {
        // Silently fail — section just won't render
      }
    }
    fetchMerch();
  }, []);

  if (products.length === 0) return null;

  const doubled = [...products, ...products];

  return (
    <section className="py-10 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-6 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={16} className="text-amber-400" />
            </div>
            <span className="text-white font-bold text-lg">OFFICIAL MERCH</span>
          </div>
          <Link
            href="/merch"
            className="text-blue-400 text-sm font-bold hover:text-blue-300 transition flex items-center gap-1"
          >
            Shop All <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex gap-4 whitespace-nowrap"
          style={{
            animation: `events-marquee ${products.length * 4}s linear infinite`,
          }}
        >
          {doubled.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href={`/merch/${product.slug}`}
              className="inline-flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl transition-all duration-300 group shrink-0 hover:scale-105"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-white/10"
                />
              )}
              <div className="max-w-[140px]">
                <p className="text-white text-xs font-bold truncate group-hover:text-amber-300 transition-colors">
                  {product.name}
                </p>
                {product.price && (
                  <p className="text-green-400 text-sm font-bold mt-0.5">
                    {typeof product.price === 'number' ? `$${product.price}` : product.price}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes events-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success) {
          setEvents(data.events || []);
        } else {
          setError(data.error || 'Failed to load events');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Countdown timer
  useEffect(() => {
    setMounted(true);
    const targetDate = new Date('2026-09-05T14:00:00-05:00');

    function updateCountdown() {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const filters = [
    { id: 'all', label: 'All Events', icon: Sparkles },
    { id: 'LOTL', label: 'LOTL', icon: Music },
    { id: 'IDMG', label: 'IDMG', icon: Ticket },
    { id: 'Foundation', label: 'Foundation', icon: Heart },
  ];

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter(e => e.organization === activeFilter);

  const countdownUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div className="min-h-screen relative">
      {/* ─── FIXED 3D LOGO VIDEO BACKGROUND (entire page) ───── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.45]"
          style={{ filter: 'saturate(1.3) contrast(1.1)' }}
        >
          <source src="/videos/lotl-day-3d-logo.mp4" type="video/mp4" />
        </video>
      </div>

      {/* ─── SECTION 1: LOTL HERO ─────────────────────────────── */}
      <section className="relative min-h-[85vh] md:min-h-[100vh] flex flex-col overflow-hidden">
        {/* Animated orbs */}
        <div className="bg-orb w-[600px] h-[600px] bg-green-500 top-[-200px] left-[-150px] opacity-20 z-[2]" />
        <div className="bg-orb w-[500px] h-[500px] bg-emerald-500 bottom-[-150px] right-[-200px] opacity-15 z-[2]" style={{ animationDelay: '-5s' }} />
        <div className="bg-orb w-[350px] h-[350px] bg-green-400 top-[40%] left-[60%] opacity-10 z-[2]" style={{ animationDelay: '-10s' }} />

        {/* Content */}
        <div className="relative z-10 max-w-screen-xl mx-auto px-6 text-center pt-24 md:pt-32 pb-20 flex-1 flex flex-col justify-center">
          {/* Year badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/30 rounded-full animate-pulse">
              <Flame size={16} className="text-orange-400" />
              <span className="text-green-300 text-sm font-black uppercase tracking-widest">Year 5</span>
              <Flame size={16} className="text-orange-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">
            Love on the Lawn{' '}
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Day 2026
            </span>
          </h1>

          {/* Date + Location */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-white/70">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-400" />
              <span className="font-semibold">September 5, 2026</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-green-400" />
              <span className="font-semibold">Festival Park, Elgin, IL</span>
            </div>
          </div>

          {/* Countdown */}
          {mounted && (
            <div className="flex items-center justify-center gap-3 md:gap-5 mb-8">
              {countdownUnits.map((unit) => (
                <div
                  key={unit.label}
                  className="w-[72px] md:w-[88px] py-3 md:py-4 bg-gradient-to-b from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl backdrop-blur-sm"
                >
                  <p className="text-2xl md:text-4xl font-black text-white tabular-nums">
                    {String(unit.value).padStart(2, '0')}
                  </p>
                  <p className="text-green-300/70 text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1">
                    {unit.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link
              href="/events/lotl-2026"
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 flex items-center gap-2 text-lg"
            >
              <Ticket size={20} />
              Get Tickets
            </Link>
            <Link
              href="/lotl"
              className="px-8 py-4 bg-white/5 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <Sparkles size={18} />
              Explore LOTL
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/40">
            <div className="text-center">
              <p className="text-white font-black text-xl">10K+</p>
              <p className="text-xs uppercase tracking-wider">Capacity</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-white font-black text-xl">Year 5</p>
              <p className="text-xs uppercase tracking-wider">Anniversary</p>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="text-center">
              <p className="text-white font-black text-xl">100%</p>
              <p className="text-xs uppercase tracking-wider">Community</p>
            </div>
          </div>
        </div>

        {/* Bottom gradient glow divider */}
        <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-mystation-navyDark to-transparent" />
      </section>

      {/* ─── SECTION 2: UPCOMING EVENTS ───────────────────────── */}
      <section className="pt-16 pb-4">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-3xl lg:text-4xl font-black text-white">
              Upcoming{' '}
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Events
              </span>
            </h2>
            {!loading && !error && (
              <span className="text-white/30 text-sm font-medium">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-40 bg-mystation-navyDark/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-4 no-scrollbar">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeFilter === filter.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 lg:py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket size={36} className="text-red-400" />
              </div>
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar size={36} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {activeFilter === 'all' ? 'No events yet' : `No ${activeFilter} events`}
              </h3>
              <p className="text-white/40 mb-6">
                {activeFilter === 'all'
                  ? 'Check back soon for upcoming events and experiences.'
                  : 'Try a different filter or check back soon.'}
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  View all events
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: MERCH MARQUEE ─────────────────────────── */}
      <MerchMarquee />

      {/* ─── SECTION 4: CTA ───────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="relative glass rounded-3xl p-10 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-indigo-900/20 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-green-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Powered by MyTicketsLive</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Never Miss a{' '}
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Live Experience
                </span>
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                From Love on the Lawn to exclusive IDMG showcases -- every ticket purchase
                supports youth music programs through the Mike Page Foundation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/events/lotl-2026"
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Ticket size={18} />
                  LOTL 2026 Tickets
                </Link>
                <Link
                  href="/merch"
                  className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <ShoppingBag size={18} />
                  Shop Merch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
