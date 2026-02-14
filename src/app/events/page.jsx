/**
 * MYTICKETSLIVE - Events Listing Page
 * Browse all events from IDMG, LOTL, and Mike Page Foundation
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, MapPin, Ticket, Clock, Loader2, Filter,
  Music, Heart, Sparkles, ChevronRight, Users
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
            />
          ) : (
            <EventImagePlaceholder name={event.name} />
          )}

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
                  ${(startingPrice / 100).toFixed(0)}
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

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filters = [
    { id: 'all', label: 'All Events', icon: Sparkles },
    { id: 'LOTL', label: 'LOTL', icon: Music },
    { id: 'IDMG', label: 'IDMG', icon: Ticket },
    { id: 'Foundation', label: 'Foundation', icon: Heart },
  ];

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter(e => e.organization === activeFilter);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-indigo-950/50 to-mystation-navyDark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
        <div className="bg-orb w-[600px] h-[600px] bg-blue-500 top-[-250px] left-[-150px] opacity-30" />
        <div className="bg-orb w-[500px] h-[500px] bg-indigo-500 top-[50px] right-[-200px] opacity-20" style={{ animationDelay: '-4s' }} />
        <div className="bg-orb w-[400px] h-[400px] bg-purple-500 bottom-[-100px] left-[30%] opacity-15" style={{ animationDelay: '-8s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-screen-xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-8">
            <Ticket size={16} className="text-blue-400" />
            <span className="text-blue-300 text-sm font-bold uppercase tracking-wider">MyTicketsLive</span>
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              EVENTS
            </span>
          </h1>

          <p className="text-lg lg:text-xl text-white/50 mb-8 max-w-2xl mx-auto font-body">
            Live experiences from IDMG. Concerts, festivals, and exclusive gatherings --
            all supporting youth music programs through the Mike Page Foundation.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <span className="text-sm">10,000+ fans served</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Music size={18} className="text-blue-400" />
              <span className="text-sm">Live music events</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-blue-400" />
              <span className="text-sm">100% to the community</span>
            </div>
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
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-white/40 text-sm">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="relative glass rounded-3xl p-10 lg:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-500/15 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <Sparkles size={14} className="text-blue-400" />
                <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Powered by MyTicketsLive</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
                Never Miss a <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Moment</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 max-w-2xl mx-auto">
                From Love on the Lawn to exclusive IDMG showcases -- every ticket purchase
                supports youth music programs through the Mike Page Foundation.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/lotl"
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green-500/30 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Calendar size={18} />
                  LOTL 2026
                </Link>
                <Link
                  href="/merch"
                  className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  <Heart size={18} />
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
