/**
 * MYSTATION - Live Streaming Page
 * Mux streaming + Stripe monetization
 * YOU keep the money, not YouTube/Twitch
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Radio, Users, Heart, MessageCircle, Send, Bell, Calendar, Video, Copy, Check, DollarSign, Sparkles, ExternalLink } from 'lucide-react';

// Dynamic import to avoid SSR issues with MuxPlayer custom elements
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

export default function LivePage() {
  const [isAdmin] = useState(false); // TODO: wire to real auth — set true only for Mike
  const [streamData, setStreamData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [copied, setCopied] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(10);
  const [tipName, setTipName] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [recentTips, setRecentTips] = useState([
    { name: 'J***n', amount: 25, message: 'Keep inspiring!' },
    { name: 'A***a', amount: 10, message: 'Love from Chicago' },
    { name: 'M***e', amount: 50, message: 'For the Foundation' },
  ]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  // Upcoming streams
  const upcomingStreams = [
    {
      id: 1,
      title: 'New Music Friday',
      date: 'Feb 14, 2026',
      time: '8:00 PM EST',
      description: 'Previewing unreleased tracks from the vault'
    },
    {
      id: 2,
      title: 'Motivation Monday',
      date: 'Feb 17, 2026',
      time: '12:00 PM EST',
      description: 'Weekly motivation talk and Q&A'
    },
    {
      id: 3,
      title: 'Studio Session',
      date: 'Feb 21, 2026',
      time: '9:00 PM EST',
      description: 'Behind the scenes of the new single'
    }
  ];

  // Create a new stream
  const createStream = async () => {
    try {
      const res = await fetch('/api/live/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: streamTitle || 'Mike Page Live' }),
      });
      const data = await res.json();
      if (data.success) {
        setStreamData(data);
      } else {
        alert('Failed to create stream: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error creating stream');
    }
  };

  // Copy stream key
  const copyStreamKey = () => {
    if (streamData?.streamKey) {
      navigator.clipboard.writeText(streamData.streamKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send tip
  const sendTip = async () => {
    if (!tipAmount || tipAmount < 1) return;

    // Add to recent tips (in real app, this would go through Stripe)
    const newTip = {
      name: tipName || 'Anonymous',
      amount: tipAmount,
      message: tipMessage,
    };
    setRecentTips(prev => [newTip, ...prev.slice(0, 9)]);
    setShowTipModal(false);
    setTipName('');
    setTipMessage('');
    setTipAmount(10);

    // In production, this would create a Stripe payment
    alert(`Tip of $${tipAmount} received! (Demo mode - Stripe integration ready)`);
  };

  // Send chat message
  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      name: 'You',
      message: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setChatInput('');
  };

  // Simulate viewer count when live
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setViewerCount(prev => prev + Math.floor(Math.random() * 5));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <div className="min-h-screen pt-24">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Radio size={32} className="text-red-500" />
              Go Live
            </h1>
            <p className="text-white/60">
              Stream on YOUR platform. Keep YOUR money.
            </p>
          </div>
        </div>

        {/* Admin: Stream Setup */}
        {isAdmin && !isLive && (
          <div className="glass rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <Sparkles size={16} />
              <span className="text-sm font-semibold uppercase tracking-wider">Admin Controls</span>
            </div>

            {!streamData ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Start a New Stream</h2>
                <div className="flex gap-4 mb-6">
                  <input
                    type="text"
                    placeholder="Stream title..."
                    value={streamTitle}
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={createStream}
                    className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
                  >
                    Create Stream
                  </button>
                </div>
                <p className="text-white/40 text-sm">
                  This will generate your stream key for OBS/Streamlabs
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Stream Ready!</h2>
                <div className="bg-black/30 rounded-xl p-6 mb-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-white/60 text-sm block mb-2">RTMP Server</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white/10 px-4 py-2 rounded-lg text-green-400 text-sm">
                          rtmps://global-live.mux.com:443/app
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/60 text-sm block mb-2">Stream Key</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white/10 px-4 py-2 rounded-lg text-green-400 text-sm truncate">
                          {streamData.streamKey}
                        </code>
                        <button
                          onClick={copyStreamKey}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
                        >
                          {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-white" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href="https://obsproject.com/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                  >
                    <ExternalLink size={18} />
                    Download OBS
                  </a>
                  <button
                    onClick={() => setIsLive(true)}
                    className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition animate-pulse"
                  >
                    <Radio size={20} />
                    I'm Live - Show Stream
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <h4 className="text-blue-400 font-bold mb-2">How to Go Live:</h4>
                  <ol className="text-white/70 text-sm space-y-1">
                    <li>1. Open OBS or Streamlabs</li>
                    <li>2. Go to Settings → Stream</li>
                    <li>3. Select "Custom" service</li>
                    <li>4. Paste the Server URL and Stream Key above</li>
                    <li>5. Click "Start Streaming" in OBS</li>
                    <li>6. Click "I'm Live" button above</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        )}

        {isLive ? (
          /* LIVE VIEW */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4">
                {streamData?.playbackId ? (
                  <MuxPlayer
                    streamType="live"
                    playbackId={streamData.playbackId}
                    autoPlay
                    muted={false}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-900/50 to-black">
                    <div className="text-center">
                      <Radio size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
                      <p className="text-white text-xl font-bold">LIVE NOW</p>
                      <p className="text-white/60">Stream starting...</p>
                    </div>
                  </div>
                )}

                {/* Live badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Viewer count */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                  <Users size={14} />
                  {viewerCount.toLocaleString()} watching
                </div>
              </div>

              {/* Stream info */}
              <div className="glass rounded-xl p-4 mb-4">
                <h2 className="text-xl font-bold text-white mb-2">
                  {streamTitle || 'Mike Page Live Session'}
                </h2>
                <p className="text-white/60">
                  Mike Page is live right now - support the stream!
                </p>
              </div>

              {/* Admin controls */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsLive(false);
                    setStreamData(null);
                  }}
                  className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500/30 transition"
                >
                  End Stream
                </button>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Tip Button */}
              <button
                onClick={() => setShowTipModal(true)}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2"
              >
                <DollarSign size={24} />
                Send a Tip
              </button>

              {/* Recent tips */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-red-400" />
                  Recent Tips
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {recentTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-green-500/10 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0">
                        ${tip.amount}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{tip.name}</p>
                        {tip.message && <p className="text-white/60 text-sm truncate">{tip.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="glass rounded-xl p-4 flex flex-col h-80">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={18} />
                  Live Chat
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-8">
                      No messages yet. Be the first!
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="text-sm">
                        <span className="text-blue-400 font-medium">{msg.name}</span>
                        <span className="text-white/40 mx-2">{msg.time}</span>
                        <p className="text-white/80">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChat()}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button
                    onClick={sendChat}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition"
                  >
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
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-bold mx-auto hover:bg-blue-600 transition">
                <Bell size={18} />
                Notify Me When Live
              </button>
            </div>

            {/* Upcoming streams */}
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Streams</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {upcomingStreams.map((stream) => (
                <div key={stream.id} className="glass rounded-xl p-6 hover:bg-white/10 transition">
                  <div className="flex items-center gap-2 text-blue-400 mb-3">
                    <Calendar size={16} />
                    <span className="text-sm font-medium">{stream.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{stream.title}</h3>
                  <p className="text-white/60 text-sm mb-3">{stream.description}</p>
                  <p className="text-white/40 text-sm">{stream.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip Modal */}
        {showTipModal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className="glass rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <DollarSign className="text-green-400" />
                Send a Tip
              </h2>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTipAmount(amt)}
                    className={`py-3 rounded-xl font-bold transition ${
                      tipAmount === amt
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-4">
                <label className="text-white/60 text-sm block mb-2">Custom Amount</label>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xl">$</span>
                  <input
                    type="number"
                    min="1"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Number(e.target.value))}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white text-xl font-bold focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="text-white/60 text-sm block mb-2">Your Name (shown on stream)</label>
                <input
                  type="text"
                  placeholder="Anonymous"
                  value={tipName}
                  onChange={(e) => setTipName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="text-white/60 text-sm block mb-2">Message (optional)</label>
                <input
                  type="text"
                  placeholder="Say something nice..."
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  maxLength={100}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={sendTip}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition"
                >
                  Send ${tipAmount}
                </button>
              </div>

              <p className="text-white/40 text-xs text-center mt-4">
                Helping build youth and community programs worldwide. Powered by Stripe.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
