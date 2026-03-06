'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';
import ChannelTabs from './ChannelTabs';
import CommunityPost from './CommunityPost';
import CreatePost from './CreatePost';

export default function CommunityFeed() {
  const [channel, setChannel] = useState('general');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const savedUsername = localStorage.getItem('mystation-fan-username');
    const savedOwner = localStorage.getItem('mystation-fan-wall-owner');
    const savedLikes = localStorage.getItem('mystation-community-likes');
    if (savedUsername) setUsername(savedUsername);
    if (savedOwner === 'true') setIsOwner(true);
    if (savedLikes) { try { setLikedPosts(JSON.parse(savedLikes)); } catch {} }
    setIsSubscriber(document.cookie.includes('mystation-sub=true'));
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/fan-wall?channel=${channel}`);
      const data = await res.json();
      if (data.posts) {
        const sorted = data.posts.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setPosts(sorted);
      }
    } catch {} finally { setLoading(false); }
  }, [channel]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const handlePost = async (body) => {
    if (!username) { setShowNamePrompt(true); return; }
    const res = await fetch('/api/fan-wall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) await fetchPosts();
  };

  const handleLike = async (postId) => {
    if (likedPosts.includes(postId)) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    const updated = [...likedPosts, postId];
    setLikedPosts(updated);
    localStorage.setItem('mystation-community-likes', JSON.stringify(updated));
    try { await fetch('/api/fan-wall', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: postId }) }); } catch {}
  };

  const handleReply = async (postId, text) => {
    if (!username) { setShowNamePrompt(true); return; }
    const body = { username, content: text, avatar: '💬', parentId: postId, channel };
    if (isOwner) body.ownerSecret = localStorage.getItem('mystation-fan-wall-token');
    const res = await fetch('/api/fan-wall', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) await fetchPosts();
  };

  const handleReact = async (postId, emoji) => {
    if (!isOwner) return;
    await fetch('/api/fan-wall', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: postId, reaction: emoji, ownerSecret: localStorage.getItem('mystation-fan-wall-token') }) });
    await fetchPosts();
  };

  const handlePin = async (postId, pinned) => {
    if (!isOwner) return;
    await fetch('/api/community/pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, pinned, adminKey: 'mpf2026' }) });
    await fetchPosts();
  };

  const handleVote = async (postId, optionIndex) => {
    const res = await fetch('/api/community/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, optionIndex }) });
    const data = await res.json();
    if (data.success) {
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, poll_options: { ...p.poll_options, counts: data.counts, myVote: data.myVote } }));
    }
  };

  const handleSetName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem('mystation-fan-username', nameInput.trim());
    setUsername(nameInput.trim());
    setShowNamePrompt(false);
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <MessageCircle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Community</h3>
              <p className="text-white/50 text-sm">Connect with the MyStation fam</p>
            </div>
          </div>
          <button onClick={fetchPosts} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white/40 hover:text-white/70">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <ChannelTabs active={channel} onChange={setChannel} />
      {showNamePrompt && (
        <div className="p-4 border-b border-white/10 bg-purple-500/5">
          <p className="text-white/60 text-sm mb-3">Choose your display name:</p>
          <div className="flex gap-2">
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSetName()} placeholder="Your name" autoFocus maxLength={30} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50" />
            <button onClick={handleSetName} disabled={!nameInput.trim()} className="px-5 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white font-semibold rounded-xl transition">Save</button>
          </div>
        </div>
      )}
      {!showNamePrompt && (channel !== 'announcements' || isOwner) && (
        <CreatePost channel={channel} username={username} isOwner={isOwner} isSubscriber={isSubscriber} onPost={handlePost} />
      )}
      <div className="p-4 space-y-4 max-h-[800px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-10">
            <RefreshCw size={32} className="text-white/20 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40">No posts in this channel yet. Be the first!</p>
          </div>
        ) : (
          posts.map(post => (
            <CommunityPost key={post.id} post={post} onLike={handleLike} onReply={handleReply} onReact={handleReact} onPin={handlePin} onVote={handleVote} isOwner={isOwner} likedPosts={likedPosts} />
          ))
        )}
      </div>
    </div>
  );
}
