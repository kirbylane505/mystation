/**
 * MYSTATION - Fan Wall (LIVE)
 * Supabase-backed community wall — posts persist for all users
 * Anyone can post (no subscription required)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Heart, Crown, Star, RefreshCw } from 'lucide-react';

const AVATARS = ['🎤', '🎧', '🎵', '🔥', '⭐', '👑', '💜', '🎹', '🎸', '🎺'];

export default function FanWall() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [userAvatar, setUserAvatar] = useState('🎤');
  const [likedPosts, setLikedPosts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // Fetch posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/fan-wall');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    // Load saved username + avatar + likes from localStorage
    const savedUsername = localStorage.getItem('mystation-fan-username');
    const savedAvatar = localStorage.getItem('mystation-fan-avatar');
    const savedLikes = localStorage.getItem('mystation-fan-wall-likes');
    if (savedUsername) setUsername(savedUsername);
    if (savedAvatar) setUserAvatar(savedAvatar);
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

    fetchPosts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handleSubmit = async () => {
    if (!newPost.trim()) return;

    if (!username) {
      setShowNamePrompt(true);
      return;
    }

    setPosting(true);
    try {
      const res = await fetch('/api/fan-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          content: newPost.trim(),
          avatar: userAvatar,
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setNewPost('');
      }
    } catch (err) {
      console.error('Failed to post:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleSetUsername = () => {
    if (!username.trim()) return;
    localStorage.setItem('mystation-fan-username', username.trim());
    localStorage.setItem('mystation-fan-avatar', userAvatar);
    setShowNamePrompt(false);
    // Re-trigger submit after name is set
    setTimeout(() => handleSubmit(), 100);
  };

  const handleLike = async (postId) => {
    if (likedPosts.includes(postId)) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
    ));
    const updatedLikes = [...likedPosts, postId];
    setLikedPosts(updatedLikes);
    localStorage.setItem('mystation-fan-wall-likes', JSON.stringify(updatedLikes));

    try {
      await fetch('/api/fan-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTierBadge = (tier) => {
    if (tier === 'vip') return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'VIP' };
    if (tier === 'foundation') return { icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Foundation' };
    return { icon: Heart, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Fan' };
  };

  if (!mounted) return null;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Fan Wall</h3>
            <p className="text-white/50 text-sm">Connect with the MyStation community</p>
          </div>
          <button
            onClick={fetchPosts}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white/70"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Post Input — Open to everyone */}
      <div className="px-6 py-4 border-b border-white/10">
        {showNamePrompt ? (
          <div>
            <p className="text-white/60 text-sm mb-3">Choose your display name & avatar:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setUserAvatar(a)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition ${
                    userAvatar === a ? 'bg-purple-500/30 ring-2 ring-purple-400' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                placeholder="Your name"
                autoFocus
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-400/50"
              />
              <button
                onClick={handleSetUsername}
                disabled={!username.trim()}
                className={`px-5 py-3 rounded-xl font-semibold text-sm transition ${
                  username.trim()
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0">
              {userAvatar}
            </div>
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !posting && handleSubmit()}
              placeholder="Share your thoughts with the community..."
              className="flex-1 bg-white/10 border border-white/20 rounded-3xl px-5 py-3 text-white text-sm outline-none focus:border-purple-400/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!newPost.trim() || posting}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${
                newPost.trim() && !posting
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="px-6 py-4 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={24} className="text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No posts yet</p>
            <p className="text-white/30 text-sm mt-2">Be the first to share!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(post => {
              const tierBadge = getTierBadge(post.tier);
              const TierIcon = tierBadge.icon;

              return (
                <div
                  key={post.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0">
                      {post.avatar || '🎤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-white text-sm">{post.username}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tierBadge.bg} ${tierBadge.color}`}>
                          <TierIcon size={10} />
                          {tierBadge.label}
                        </span>
                        <span className="text-white/30 text-xs">{formatDate(post.created_at)}</span>
                      </div>
                      <p className="text-white/85 text-sm leading-relaxed">{post.content}</p>
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-2xl text-xs transition ${
                          likedPosts.includes(post.id)
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        <Heart size={14} fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                        {post.likes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
