/**
 * MYSTATION - Live Streaming Page
 * Mike goes live, fans donate in real-time
 */

'use client';

import { useState } from 'react';
import DonationButton from '@/components/DonationButton';
import { Radio, Users, Heart, MessageCircle, Send, Bell, Calendar } from 'lucide-react';

export default function LivePage() {
  const [chatMessage, setChatMessage] = useState('');
  const [isLive, setIsLive] = useState(false); // Will be controlled by backend

  // Mock data - would come from backend
  const upcomingStreams = [
    {
      id: 1,
      title: 'New Music Friday',
      date: 'Feb 7, 2026',
      time: '8:00 PM EST',
      description: 'Previewing unreleased tracks from the vault'
    },
    {
      id: 2,
      title: 'Motivation Monday',
      date: 'Feb 10, 2026',
      time: '12:00 PM EST',
      description: 'Weekly motivation talk and Q&A'
    },
    {
      id: 3,
      title: 'Studio Session',
      date: 'Feb 14, 2026',
      time: '9:00 PM EST',
      description: 'Behind the scenes of the new single'
    }
  ];

  const recentDonations = [
    { name: 'J***n', amount: 25, message: 'Keep inspiring!' },
    { name: 'A***a', amount: 10, message: 'Love from Chicago' },
    { name: 'M***e', amount: 50, message: 'For the Foundation' },
    { name: 'K***y', amount: 5, message: '' },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Radio size={32} className="text-mystation-gold" />
            Live
          </h1>
          <p className="text-white/60">
            Watch Mike Page live and donate in real-time
          </p>
        </div>

        {isLive ? (
          /* LIVE VIEW */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-mystation-accent rounded-2xl overflow-hidden mb-4">
                {/* Live badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  <Users size={14} />
                  1,234 watching
                </div>

                {/* Video placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">🎤</span>
                </div>
              </div>

              {/* Stream info */}
              <div className="glass rounded-xl p-4 mb-4">
                <h2 className="text-xl font-bold text-white mb-2">New Music Preview Session</h2>
                <p className="text-white/60">
                  Mike Page is live from the studio showing unreleased tracks
                </p>
              </div>

              {/* Live donation button */}
              <div className="glass rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Support the Stream</h3>
                <p className="text-white/60 mb-4 text-sm">
                  Donations show on stream! 100% goes to Mike Page Foundation
                </p>
                <DonationButton variant="hero" />
              </div>
            </div>

            {/* Chat & Donations sidebar */}
            <div className="space-y-4">
              {/* Recent donations */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-mystation-gold" />
                  Recent Donations
                </h3>
                <div className="space-y-3">
                  {recentDonations.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-mystation-gold/10 rounded-lg">
                      <div className="w-8 h-8 bg-mystation-gold rounded-full flex items-center justify-center text-xs font-bold text-mystation-dark">
                        ${d.amount}
                      </div>
                      <div>
                        <p className="text-white font-medium">{d.name}</p>
                        {d.message && <p className="text-white/60 text-sm">{d.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="glass rounded-xl p-4 flex flex-col h-96">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={18} />
                  Live Chat
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {/* Chat messages would go here */}
                  <div className="text-center text-white/40 text-sm py-8">
                    Chat messages appear here
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-mystation-gold text-sm"
                  />
                  <button className="bg-mystation-gold text-mystation-dark p-2 rounded-lg">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OFFLINE VIEW */
          <div>
            {/* Offline banner */}
            <div className="glass rounded-2xl p-12 text-center mb-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Radio size={40} className="text-white/40" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Mike is Offline</h2>
              <p className="text-white/60 mb-6">
                Turn on notifications to know when Mike goes live
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-mystation-gold text-mystation-dark rounded-full font-bold mx-auto hover:bg-mystation-gold/90 transition">
                <Bell size={18} />
                Notify Me When Live
              </button>
            </div>

            {/* Upcoming streams */}
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Streams</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {upcomingStreams.map(stream => (
                <div key={stream.id} className="glass rounded-xl p-6 hover:bg-white/10 transition">
                  <div className="flex items-center gap-2 text-mystation-gold mb-3">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">{stream.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{stream.title}</h3>
                  <p className="text-white/60 text-sm mb-3">{stream.description}</p>
                  <p className="text-white/40 text-sm">{stream.time}</p>
                </div>
              ))}
            </div>

            {/* Past streams / VOD */}
            <h2 className="text-2xl font-bold text-white mb-6">Previous Streams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="glass rounded-xl overflow-hidden hover:bg-white/10 transition cursor-pointer">
                  <div className="aspect-video bg-mystation-accent flex items-center justify-center relative">
                    <span className="text-4xl">🎬</span>
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      1:23:45
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-white mb-1">Studio Session #{i}</h4>
                    <p className="text-white/60 text-sm">Jan {20 + i}, 2026</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
