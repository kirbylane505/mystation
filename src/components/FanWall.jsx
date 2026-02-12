/**
 * MYSTATION - Fan Wall (LIVE — Supabase-backed)
 * Community wall — everyone can post & reply
 * Owner (Mike Page) can react with emojis
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Heart, Crown, Star, RefreshCw, Reply, ChevronDown, ChevronUp } from 'lucide-react';

const REACTIONS = ['🔥', '💯', '❤️', '👏', '🙌', '💪'];

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
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [isOwner, setIsOwner] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/fan-wall');
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
      setError(null);
    } catch {
      setError('Could not load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedUsername = localStorage.getItem('mystation-fan-username');
    const savedLikes = localStorage.getItem('mystation-fan-wall-likes');
    const savedOwner = localStorage.getItem('mystation-fan-wall-owner');
    if (savedUsername) setUsername(savedUsername);
    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
    if (savedOwner === 'true') setIsOwner(true);
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const ensureUsername = (callback) => {
    if (!username) {
      setShowNamePrompt(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!newPost.trim()) return;
    if (!ensureUsername()) return;

    setPosting(true);
    try {
      const body = { username, content: newPost.trim(), avatar: '🎤' };
      if (isOwner) body.ownerSecret = 'mikepage2026';

      const res = await fetch('/api/fan-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPosts();
        setNewPost('');
      } else {
        setError(data.error || 'Failed to post');
      }
    } catch {
      setError('Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    if (!ensureUsername()) return;

    try {
      const body = { username, content: replyText.trim(), avatar: '💬', parentId };
      if (isOwner) body.ownerSecret = 'mikepage2026';

      const res = await fetch('/api/fan-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPosts();
        setReplyText('');
        setReplyingTo(null);
        setExpandedReplies(prev => ({ ...prev, [parentId]: true }));
      }
    } catch {
      setError('Failed to reply');
    }
  };

  const handleReact = async (postId, emoji) => {
    if (!isOwner) return;
    try {
      await fetch('/api/fan-wall', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, reaction: emoji, ownerSecret: 'mikepage2026' }),
      });
      await fetchPosts();
    } catch {}
  };

  const handleSetUsername = () => {
    if (!username.trim()) return;
    localStorage.setItem('mystation-fan-username', username.trim());
    setShowNamePrompt(false);
  };

  const handleLike = async (postId) => {
    if (likedPosts.includes(postId)) return;
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
        body: JSON.stringify({ id: postId }),
      });
    } catch {}
  };

  const toggleOwner = () => {
    const secret = prompt('Enter owner code:');
    if (secret === 'mikepage2026') {
      setIsOwner(true);
      setUsername('Mike Page');
      localStorage.setItem('mystation-fan-wall-owner', 'true');
      localStorage.setItem('mystation-fan-username', 'Mike Page');
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
          <div className="flex items-center gap-2">
            {isOwner && (
              <span className="px-2 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-xs font-bold">OWNER</span>
            )}
            <button
              onClick={fetchPosts}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white/70"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Post Input */}
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
            <div
              className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0 cursor-pointer"
              onDoubleClick={toggleOwner}
            >
              {isOwner ? '👑' : '🎤'}
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
              {posting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Posts */}
      <div className="p-4 max-h-[700px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={32} className="text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No posts yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const tierBadge = getTierBadge(post.tier);
              const TierIcon = tierBadge.icon;
              const replies = post.replies || [];
              const reactions = post.reactions || [];
              const isExpanded = expandedReplies[post.id];

              return (
                <div key={post.id} className="bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition">
                  {/* Main Post */}
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xl shrink-0">
                        {post.avatar || '🎤'}
                      </div>
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

                        {/* Reactions from owner */}
                        {reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {reactions.map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm" title={`${r.by} reacted`}>
                                {r.emoji}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 mt-2.5">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${
                              likedPosts.includes(post.id)
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            <Heart size={13} fill={likedPosts.includes(post.id) ? 'currentColor' : 'none'} />
                            {post.likes || 0}
                          </button>

                          <button
                            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/50 hover:bg-white/10 transition"
                          >
                            <Reply size={13} />
                            Reply{replies.length > 0 ? ` (${replies.length})` : ''}
                          </button>

                          {/* Owner reaction buttons */}
                          {isOwner && (
                            <div className="flex gap-1 ml-auto">
                              {REACTIONS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(post.id, emoji)}
                                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-yellow-500/20 flex items-center justify-center text-sm transition hover:scale-110"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies Section */}
                  {replies.length > 0 && (
                    <div className="border-t border-white/5">
                      <button
                        onClick={() => setExpandedReplies(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                        className="w-full px-4 py-2 flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 space-y-3">
                          {replies.map(reply => (
                            <div key={reply.id} className="flex gap-2 pl-6 border-l-2 border-purple-500/20">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm shrink-0">
                                {reply.avatar || '💬'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-semibold text-white text-xs">{reply.username}</span>
                                  <span className="text-white/30 text-[10px]">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-white/70 text-xs leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === post.id && (
                    <div className="px-4 pb-3 border-t border-white/5 pt-3">
                      <div className="flex gap-2 pl-6">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                          placeholder="Write a reply..."
                          maxLength={300}
                          autoFocus
                          className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-xs outline-none focus:border-purple-500/50"
                        />
                        <button
                          onClick={() => handleReply(post.id)}
                          disabled={!replyText.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white text-xs font-semibold rounded-full transition"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
