/**
 * MYSTATION - Featured Song of the Week
 * With comments and live chat functionality
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Heart, MessageCircle, Send, Music, Flame, Crown, Clock, Radio } from 'lucide-react';
import { featuredSong } from '@/data/tracks';
import { usePlayerStore } from '@/store/playerStore';

export default function FeaturedSong() {
  const { currentTrack, isPlaying, setQueue, togglePlay } = usePlayerStore();
  const [comments, setComments] = useState([
    { id: 1, user: 'ATLFan247', text: 'This track is FIRE! Mike Page never misses', time: '2m ago', likes: 12 },
    { id: 2, user: 'DreamzUp', text: 'Been waiting for new music from IDMG', time: '5m ago', likes: 8 },
    { id: 3, user: 'ChiTownLove', text: 'Elgin in the building! Proud of you Mike', time: '12m ago', likes: 23 },
  ]);
  const [liveMessages, setLiveMessages] = useState([
    { id: 1, user: 'MusicLover', text: 'Just tuned in!', color: 'text-blue-400' },
    { id: 2, user: 'PageNation', text: 'This beat is crazy', color: 'text-green-400' },
    { id: 3, user: 'IDMG_Supporter', text: 'Foundation doing great things', color: 'text-purple-400' },
  ]);
  const [newComment, setNewComment] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [listeners, setListeners] = useState(47);
  const chatRef = useRef(null);

  // Simulate live listener count
  useEffect(() => {
    const interval = setInterval(() => {
      setListeners(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [liveMessages]);

  const handlePlay = () => {
    const track = {
      id: featuredSong.id,
      title: featuredSong.title,
      artist: featuredSong.artist,
      album: featuredSong.album,
      audioFile: featuredSong.audioFile,
      duration: featuredSong.duration,
    };

    if (currentTrack?.id === featuredSong.id) {
      togglePlay();
    } else {
      setQueue([track], 0);
    }
  };

  const isCurrentlyPlaying = currentTrack?.id === featuredSong.id && isPlaying;

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: 'You',
      text: newComment,
      time: 'Just now',
      likes: 0,
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const colors = ['text-blue-400', 'text-green-400', 'text-purple-400', 'text-pink-400', 'text-yellow-400'];
    const message = {
      id: Date.now(),
      user: 'You',
      text: newMessage,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setLiveMessages([...liveMessages, message]);
    setNewMessage('');
  };

  const handleLikeComment = (commentId) => {
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    ));
  };

  if (!featuredSong) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-6 py-12">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Featured Song of the Week</h2>
          <p className="text-white/40 text-sm">{featuredSong.weekOf}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Featured Track Card */}
        <div className="lg:col-span-2">
          <div className={`glass rounded-3xl overflow-hidden border border-white/10 hover:border-amber-500/30 transition-all duration-500`}>
            {/* Cover Art / Gradient Background */}
            <div className={`relative h-64 bg-gradient-to-br ${featuredSong.coverGradient} flex items-center justify-center overflow-hidden`}>
              {/* Animated background */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
                <div className="absolute w-64 h-64 bg-white/10 rounded-full blur-3xl -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              {/* Play Button */}
              <button
                onClick={handlePlay}
                className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 group"
              >
                {isCurrentlyPlaying ? (
                  <Pause size={40} className="text-white" fill="white" />
                ) : (
                  <Play size={40} className="text-white ml-2" fill="white" />
                )}
                {isCurrentlyPlaying && (
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                )}
              </button>

              {/* Live indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">{listeners} listening</span>
              </div>

              {/* Featured Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500 rounded-full">
                <Flame size={14} className="text-white" />
                <span className="text-white text-sm font-bold">HOT</span>
              </div>
            </div>

            {/* Track Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{featuredSong.title}</h3>
                  <p className="text-white/60">{featuredSong.artist} - {featuredSong.album}</p>
                </div>
                <button className="p-3 glass rounded-xl hover:bg-white/10 transition">
                  <Heart size={20} className="text-white/60 hover:text-red-400" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <p className="text-lg font-bold text-white">{featuredSong.stats.bpm}</p>
                  <p className="text-xs text-white/40">BPM</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <p className="text-lg font-bold text-white">{featuredSong.stats.key}</p>
                  <p className="text-xs text-white/40">KEY</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <p className="text-lg font-bold text-white">{featuredSong.stats.loudness}</p>
                  <p className="text-xs text-white/40">LOUDNESS</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <p className="text-lg font-bold text-green-400">{featuredSong.stats.mastered ? 'YES' : 'NO'}</p>
                  <p className="text-xs text-white/40">MASTERED</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/50 text-sm leading-relaxed">
                {featuredSong.description}
              </p>
            </div>
          </div>
        </div>

        {/* Comments / Live Chat Panel */}
        <div className="glass rounded-3xl overflow-hidden border border-white/10 flex flex-col h-[500px]">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'comments'
                  ? 'text-white bg-white/5 border-b-2 border-blue-500'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <MessageCircle size={16} className="inline mr-2" />
              Comments
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === 'live'
                  ? 'text-white bg-white/5 border-b-2 border-red-500'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <Radio size={16} className="inline mr-2" />
              Live Chat
            </button>
          </div>

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-400">@{comment.user}</span>
                      <span className="text-xs text-white/30">{comment.time}</span>
                    </div>
                    <p className="text-white/80 text-sm mb-2">{comment.text}</p>
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 transition"
                    >
                      <Heart size={12} />
                      {comment.likes}
                    </button>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 rounded-xl hover:bg-blue-600 transition"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Live Chat Tab */}
          {activeTab === 'live' && (
            <>
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {liveMessages.map(msg => (
                  <div key={msg.id} className="text-sm">
                    <span className={`font-medium ${msg.color}`}>{msg.user}: </span>
                    <span className="text-white/80">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Live Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-500 rounded-xl hover:bg-red-600 transition"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
