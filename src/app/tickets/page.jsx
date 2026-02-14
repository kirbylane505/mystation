/**
 * MYTICKETSLIVE - My Tickets Page
 * View purchased tickets with QR codes and status
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ticket, Calendar, MapPin, QrCode, Download, Loader2,
  ChevronLeft, AlertCircle, CheckCircle, Clock, XCircle,
  Mail, Search
} from 'lucide-react';

// QR code API URL
function getQrUrl(data, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=0a1628&color=3b82f6&format=png`;
}

// Format date short
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

// Status badge component
function StatusBadge({ status }) {
  const config = {
    valid: {
      label: 'VALID',
      icon: CheckCircle,
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    confirmed: {
      label: 'CONFIRMED',
      icon: CheckCircle,
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    pending: {
      label: 'PENDING',
      icon: Clock,
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
    },
    used: {
      label: 'USED',
      icon: CheckCircle,
      bg: 'bg-white/10',
      border: 'border-white/20',
      text: 'text-white/50',
    },
    cancelled: {
      label: 'CANCELLED',
      icon: XCircle,
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
    expired: {
      label: 'EXPIRED',
      icon: XCircle,
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
    },
  };

  const cfg = config[status] || config.pending;
  const Icon = cfg.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 ${cfg.bg} border ${cfg.border} rounded-full`}>
      <Icon size={12} className={cfg.text} />
      <span className={`${cfg.text} text-xs font-bold`}>{cfg.label}</span>
    </div>
  );
}

// Download QR code image
async function downloadQr(orderRef) {
  try {
    const url = getQrUrl(orderRef, 400);
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `ticket-${orderRef}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: open in new tab
    window.open(getQrUrl(orderRef, 400), '_blank');
  }
}

// Single Ticket Card
function TicketCard({ ticket }) {
  const qrData = ticket.order_ref || ticket.id || 'TICKET';
  const isPast = ticket.event?.date ? new Date(ticket.event.date) < new Date() : false;

  return (
    <div className="glass rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all duration-300">
      {/* Top colored strip */}
      <div className={`h-1.5 ${
        ticket.status === 'valid' || ticket.status === 'confirmed' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
        ticket.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
        ticket.status === 'used' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
        'bg-gradient-to-r from-red-500 to-red-600'
      }`} />

      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* QR Code */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-40 h-40 bg-white rounded-xl p-2 shadow-lg">
              <img
                src={getQrUrl(qrData)}
                alt={`QR Code for ${qrData}`}
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex-1 min-w-0">
            {/* Event Name + Status */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-lg font-bold text-white line-clamp-2">
                {ticket.event?.name || 'Event'}
              </h3>
              <StatusBadge status={ticket.status} />
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              {ticket.event?.date && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Calendar size={14} className="text-blue-400 shrink-0" />
                  <span>{formatDate(ticket.event.date)}</span>
                  {isPast && <span className="text-white/30 text-xs">(Past)</span>}
                </div>
              )}
              {ticket.event?.venue && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span className="line-clamp-1">
                    {ticket.event.venue}
                    {ticket.event.city ? `, ${ticket.event.city}` : ''}
                  </span>
                </div>
              )}
              {ticket.ticket_type && (
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <Ticket size={14} className="text-blue-400 shrink-0" />
                  <span>{ticket.ticket_type?.name || ticket.tier_name || 'General Admission'}</span>
                </div>
              )}
            </div>

            {/* Order Ref + Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <span className="text-white/30 text-xs">Order Ref</span>
                <p className="text-white font-mono font-bold text-sm">{ticket.order_ref || '--'}</p>
              </div>
              <button
                onClick={() => downloadQr(qrData)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition"
              >
                <Download size={14} />
                Download QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton
function TicketSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="h-1.5 bg-white/5" />
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-40 h-40 bg-white/5 rounded-xl mx-auto md:mx-0 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
            <div className="h-4 bg-white/5 rounded w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Try to get email from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mystation_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.email) {
          setEmail(user.email);
          setSearchEmail(user.email);
          fetchTickets(user.email);
          return;
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  async function fetchTickets(emailToSearch) {
    if (!emailToSearch) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/tickets/my?email=${encodeURIComponent(emailToSearch)}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else if (res.status === 404) {
        setTickets([]);
      } else {
        setError(data.error || 'Failed to load tickets');
      }
      setHasSearched(true);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchEmail.trim()) {
      setEmail(searchEmail.trim());
      fetchTickets(searchEmail.trim());
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-indigo-950/30 to-mystation-navyDark" />
        <div className="bg-orb w-[500px] h-[500px] bg-blue-500 top-[-200px] right-[-150px] opacity-20" />
        <div className="bg-orb w-[400px] h-[400px] bg-indigo-500 bottom-[-100px] left-[-100px] opacity-15" style={{ animationDelay: '-6s' }} />

        <div className="relative max-w-screen-xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <QrCode size={16} className="text-blue-400" />
            <span className="text-blue-300 text-sm font-bold uppercase tracking-wider">My Tickets</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Your Tickets
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-lg mx-auto mb-8">
            View and manage your event tickets. Show the QR code at the door for check-in.
          </p>

          {/* Email search */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter your email to find tickets"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-2"
              >
                <Search size={16} />
                Find
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Tickets List */}
      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-6">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <TicketSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={36} className="text-red-400" />
              </div>
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => email && fetchTickets(email)}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail size={36} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Enter Your Email</h3>
              <p className="text-white/40 mb-6">
                Enter the email you used to purchase tickets to view them here.
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ticket size={36} className="text-white/20" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Tickets Found</h3>
              <p className="text-white/40 mb-6">
                No tickets found for <span className="text-white">{email}</span>.
                <br />
                Check your email or browse upcoming events.
              </p>
              <Link
                href="/events"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Calendar size={16} />
                Browse Events
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-white/40 text-sm">
                  {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} for{' '}
                  <span className="text-white">{email}</span>
                </p>
              </div>
              <div className="space-y-6">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id || ticket.order_ref} ticket={ticket} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
