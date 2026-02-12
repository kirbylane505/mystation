/**
 * MYSTATION - Fan Wall (LIVE — Supabase-backed)
 * Community comment wall — open to everyone
 * Posts persist across all users and sessions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Heart, Crown, Star, RefreshCw } from 'lucide-react';

export default function FanWall() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Load posts from API
  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/fan-wall');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
      setError(null);
    } catch (err) {
      setError('Could not load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    // Load saved username and likes from localStorage
    const savedUsername = localStorage.getItem('mystation-fan-username');
    const savedLikes = localStorage.getItem('mystation-fan-wall-likes');
    if (savedUsername) setUsername(savedUsername);
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));

    // Fetch live posts
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
          username,
          content: newPost.trim(),
          avatar: '🎤',
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        setPosts(prev => [data.post, ...prev]);
        setNewPost('');
        setError(null);
      } else {
        setError(data.error || 'Failed to post');
      }
    } catch {
      setError('Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleSetUsername = () => {
    if (!username.trim()) return;
    localStorage.setItem('mystation-fan-username', username.trim());
    setShowNamePrompt(false);
    // Re-trigger submit after setting username
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

    // Persist to API
    try {
      await fetch('/api/fan-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });
    } catch {
      // Like already shown optimistically, no rollback needed
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTierBadge = (tier) => {
    if (tier === 'vip') return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'VIP' };
    if (tier === 'supporter') return { icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Supporter' };
    return { icon: Heart, color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Fan' };
  };

  if (!mounted) return null;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Fan Wall</h3>
              <p className="text-white/50 text-sm">Connect with the MyStation community</p>
            </div>
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

      {/* Post Input — Open to Everyone */}
      <div className="p-4 border-b border-white/10">
        {showNamePrompt ? (
          <div>
            <p className="text-white/60 text-sm mb-3">Choose your display name:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
                placeholder="Your name"
                autoFocus
                maxLength={30}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSetUsername}
                disabled={!username.trim()}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:opacity-50 text-white font-semibold rounded-xl transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0">
              🎤
            </div>
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !posting && handleSubmit()}
              placeholder={username ? "Share your thoughts..." : "Type something..."}
              maxLength={500}
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-white text-sm outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!newPost.trim() || posting}
              className="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 flex items-center justify-center transition text-white"
            >
              {posting ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        )}
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
      </div>

      {/* Posts */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={32} className="text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No posts yet</p>
            <p className="text-white/30 text-sm mt-2">Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const tierBadge = getTierBadge(post.tier);
              const TierIcon = tierBadge.icon;

              return (
                <div
                  key={post.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0">
                      {post.avatar || '🎤'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="font-semibold text-white text-sm">{post.username}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tierBadge.bg} ${tierBadge.color}`}>
                          <TierIcon size={10} />
                          {tierBadge.label}
                        </span>
                        <span className="text-white/30 text-xs">{formatDate(post.created_at)}</span>
                      </div>

                      <p className="text-white/85 text-sm leading-relaxed">{post.content}</p>

                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-full text-xs transition ${
                          likedPosts.includes(post.id)
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        <Heart size={13} fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} />
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
