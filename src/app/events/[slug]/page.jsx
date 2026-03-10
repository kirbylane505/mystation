/**
 * MYTICKETSLIVE - Event Detail Page
 * Full event view with ticket tiers → directs to MyTicketsLive.com Stripe checkout
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, MapPin, Ticket, Clock, Users, ChevronLeft,
  Loader2, Check, AlertCircle,
  Shield, Sparkles, ExternalLink, ArrowRight,
  ShoppingBag, ChevronRight, Crown, Mail, Share2
} from 'lucide-react';

// ─── LOTL RECAP VIDEO BACKGROUND ──────────────────────────────
function RecapVideoBackground({ slug }) {
  if (!slug?.includes('lotl')) return null;
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.12]"
        style={{ filter: 'blur(1px) saturate(1.2)' }}
      >
        <source src="/videos/lotl-recap-2025.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-mystation-navyDark/80 via-mystation-navyDark/60 to-mystation-navyDark/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-purple-950/40" />
    </div>
  );
}

// ─── MERCH MARQUEE (Sticky bottom ticker) ─────────────────────
function MerchMarquee({ slug }) {
  const [products, setProducts] = useState([]);
  const [showMarquee, setShowMarquee] = useState(true);

  useEffect(() => {
    if (!slug?.includes('lotl')) return;
    async function fetchMerch() {
      try {
        const [pfRes, pyRes] = await Promise.allSettled([
          fetch('/api/printful/products').then(r => r.json()),
          fetch('/api/printify/products').then(r => r.json()),
        ]);

        let items = [];

        if (pfRes.status === 'fulfilled' && pfRes.value?.products) {
          items.push(...pfRes.value.products.slice(0, 8).map(p => ({
            id: p.id,
            name: p.name,
            price: p.price || p.retail_price,
            image: p.thumbnail_url || p.image,
            source: 'printful',
          })));
        }

        if (pyRes.status === 'fulfilled' && pyRes.value?.products) {
          items.push(...pyRes.value.products.slice(0, 8).map(p => ({
            id: p.id,
            name: p.title || p.name,
            price: p.price || (p.variants?.[0]?.price ? `$${(p.variants[0].price / 100).toFixed(0)}` : null),
            image: p.images?.[0]?.src || p.thumbnail_url,
            source: 'printify',
          })));
        }

        setProducts(items.slice(0, 12));
      } catch {}
    }
    fetchMerch();
  }, [slug]);

  if (!slug?.includes('lotl') || products.length === 0 || !showMarquee) return null;

  const doubled = [...products, ...products];

  return (
    <div className="fixed bottom-[76px] lg:bottom-[116px] left-0 right-0 z-[35] bg-gradient-to-r from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-t border-white/10 shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <ShoppingBag size={14} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">LOTL Official Merch</span>
          <span className="text-white/30 text-xs">— Tap to shop</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/merch"
            className="text-blue-400 text-xs font-bold hover:text-blue-300 transition flex items-center gap-1"
          >
            View All <ChevronRight size={12} />
          </Link>
          <button
            onClick={() => setShowMarquee(false)}
            className="text-white/30 hover:text-white/60 text-xs transition"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="overflow-hidden py-3">
        <div
          className="flex gap-4 animate-marquee whitespace-nowrap"
          style={{
            animation: `marquee ${products.length * 4}s linear infinite`,
          }}
        >
          {doubled.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href="/merch"
              className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 rounded-xl transition-all duration-300 group shrink-0 hover:scale-105"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover bg-white/10"
                />
              )}
              <div className="max-w-[140px]">
                <p className="text-white text-xs font-bold truncate group-hover:text-amber-300 transition-colors">
                  {product.name}
                </p>
                {product.price && (
                  <p className="text-green-400 text-xs font-bold">
                    {typeof product.price === 'number' ? `$${product.price}` : product.price}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// Format date: "Saturday, September 5, 2026 at 2:00 PM"
function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Days until event
function daysUntil(dateStr) {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch event data
  useEffect(() => {
    if (!slug) return;
    async function fetchEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${slug}`);
        const data = await res.json();
        if (data.success && data.event) {
          setEvent(data.event);
        } else {
          setError(data.error || 'Event not found');
        }
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  // Share event
  function shareEvent() {
    const url = `https://mystationlive.com/events/${slug}`;
    const text = `Check out ${event?.name} on MyTicketsLive!`;
    if (navigator.share) {
      navigator.share({ title: event?.name, text, url });
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  // MyTicketsLive checkout URL for this event
  const ticketCheckoutUrl = `https://myticketslive.com/events/${slug}`;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading event...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Event Not Found</h2>
          <p className="text-white/50 mb-6">{error || 'This event may have been removed or the link is invalid.'}</p>
          <Link href="/events" className="btn-primary inline-flex items-center gap-2">
            <ChevronLeft size={16} />
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalSold = (event.ticket_types || []).reduce((sum, tt) => sum + (tt.quantity_sold || 0), 0);
  const totalAvailable = (event.ticket_types || []).reduce((sum, tt) => sum + (tt.quantity_available || 0), 0);
  const totalRemaining = totalAvailable - totalSold;
  const days = daysUntil(event.date);
  const fullAddress = [event.venue, event.address, event.city, event.state, event.zip].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen relative">
      <RecapVideoBackground slug={slug} />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden z-10">
        {event.cover_image_url ? (
          <>
            <div className="absolute inset-0">
              <img
                src={event.cover_image_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-mystation-navyDark" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-950/70 to-mystation-navyDark" />
            <div className="bg-orb w-[600px] h-[600px] bg-blue-500 top-[-200px] left-[-150px] opacity-30" />
            <div className="bg-orb w-[400px] h-[400px] bg-indigo-500 bottom-[-100px] right-[-100px] opacity-20" style={{ animationDelay: '-5s' }} />
          </>
        )}

        <div className="relative max-w-screen-xl mx-auto px-6">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition"
          >
            <ChevronLeft size={16} />
            All Events
          </Link>

          {event.organization && (
            <div className="mb-4">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                event.organization === 'LOTL' ? 'bg-green-500/90 text-white' :
                event.organization === 'IDMG' ? 'bg-blue-500/90 text-white' :
                event.organization === 'Foundation' ? 'bg-purple-500/90 text-white' :
                'bg-white/20 text-white'
              }`}>
                {event.organization}
              </span>
            </div>
          )}

          <h1 className="text-4xl lg:text-6xl font-black text-white mb-6 max-w-3xl leading-tight">
            {event.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/70 mb-8">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              <span className="font-semibold text-white">{formatDateFull(event.date)}</span>
            </div>
            {event.venue && (
              <>
                <span className="hidden sm:block text-white/20">|</span>
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-blue-400" />
                  <span className="font-semibold text-white">{event.venue}</span>
                  {event.city && <span className="text-white/50">{event.city}, {event.state}</span>}
                </div>
              </>
            )}
          </div>

          {event.description && (
            <p className="text-white/60 text-lg max-w-2xl mb-8 leading-relaxed">
              {event.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4">
            {totalSold > 0 && (
              <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                <Ticket size={20} className="text-blue-400" />
                <div>
                  <p className="text-white font-black text-lg">{totalSold.toLocaleString()}</p>
                  <p className="text-white/40 text-xs">Tickets Sold</p>
                </div>
              </div>
            )}
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
              <Users size={20} className="text-green-400" />
              <div>
                <p className="text-white font-black text-lg">{totalRemaining.toLocaleString()}</p>
                <p className="text-white/40 text-xs">Spots Remaining</p>
              </div>
            </div>
            <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
              <Clock size={20} className="text-orange-400" />
              <div>
                <p className="text-white font-black text-lg">{days}</p>
                <p className="text-white/40 text-xs">{days === 1 ? 'Day' : 'Days'} Until Event</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Tiers */}
      <section className="py-12 lg:py-16 relative z-10">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="text-2xl lg:text-3xl font-black text-white mb-2">Tickets</h2>
            <p className="text-white/50">Secure checkout powered by Stripe on MyTicketsLive.com</p>
          </div>

          {event.ticket_types && event.ticket_types.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {event.ticket_types.filter(t => t.is_active !== false).map((tier) => {
                const soldOut = (tier.quantity_remaining || 0) <= 0;
                const priceDisplay = tier.price > 0
                  ? `$${Number(tier.price).toFixed(2)}`
                  : 'FREE';

                return (
                  <div
                    key={tier.id}
                    className={`glass rounded-2xl p-6 relative overflow-hidden ${
                      soldOut ? 'opacity-50' : ''
                    }`}
                  >
                    {soldOut && (
                      <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/80 rounded-full">
                        <span className="text-white text-xs font-bold">SOLD OUT</span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-2 pr-12">{tier.name}</h3>

                    <div className="mb-4">
                      <span className="text-3xl font-black text-white">{priceDisplay}</span>
                      {tier.price > 0 && (
                        <span className="text-white/40 text-sm ml-1">
                          {tier.name === 'Buddy Pass' ? '/ 4 tickets' :
                           tier.name === 'Squad Pack' ? '/ 6 tickets' :
                           tier.name === 'Family Pack' ? '/ 8 tickets' :
                           tier.name === 'VIP Tent' ? '/ 12 guests' :
                           tier.name === 'Parking Pass' ? '/ 1 spot' :
                           'per ticket'}
                        </span>
                      )}
                    </div>

                    {tier.description && (
                      <p className="text-white/50 text-sm mb-4">{tier.description}</p>
                    )}

                    {tier.perks && tier.perks.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {tier.perks.map((perk, i) => (
                          <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                            <Check size={14} className="text-blue-400 shrink-0" />
                            {perk}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-4 border-t border-white/10">
                      <span className="text-white/40 text-xs">
                        {soldOut ? 'Sold out' : `${tier.quantity_remaining || 0} remaining`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center mb-8">
              <Ticket size={48} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-lg">Tickets not yet available for this event.</p>
              <p className="text-white/30 text-sm mt-2">Check back soon.</p>
            </div>
          )}

          {/* GET TICKETS — Stripe checkout on MyTicketsLive */}
          <a
            href={ticketCheckoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Ticket size={22} />
            Get Tickets on MyTicketsLive
            <ExternalLink size={16} className="opacity-60" />
          </a>
          <p className="text-center text-white/30 text-xs mt-3 flex items-center justify-center gap-2">
            <Shield size={12} />
            Secure Stripe checkout. Instant ticket delivery via email.
          </p>

          {/* VIP Early Registration CTA */}
          {event.slug === 'lotl-2026' && (
            <div className="relative overflow-hidden rounded-2xl mt-8 p-[1px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500">
              <div className="bg-black/95 rounded-[15px] p-6 lg:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold tracking-wider mb-3">
                      <Crown size={12} /> VIP EARLY REGISTRATION
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Want VIP Access?</h3>
                    <p className="text-white/50 text-sm">Email us to get on the VIP early access list. Be first in line when VIP and VIP Tent tickets drop.</p>
                  </div>
                  <a
                    href="mailto:Contact@LOTLFEST.com?subject=LOTL 2026 VIP Early Registration&body=I want to be on the VIP early access list for Love on the Lawn Day 2026!"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold rounded-xl hover:from-amber-400 hover:to-yellow-400 transition-all"
                  >
                    <Mail size={18} />
                    Register for VIP
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Address + Share */}
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {fullAddress && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-blue-400" />
                  Venue
                </h3>
                <p className="text-white/70 text-sm mb-4">{fullAddress}</p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition"
                >
                  Open in Google Maps
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Share2 size={18} className="text-blue-400" />
                Share This Event
              </h3>
              <p className="text-white/50 text-sm mb-4">Spread the word and bring your crew.</p>
              <div className="flex gap-3">
                <button
                  onClick={shareEvent}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition"
                >
                  <Share2 size={16} />
                  Share Event
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${event.name}!`)}&url=${encodeURIComponent(`https://mystationlive.com/events/${slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition"
                >
                  Post on X
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {slug?.includes('lotl') && <div className="h-28 lg:h-32" />}
      <MerchMarquee slug={slug} />
    </div>
  );
}
