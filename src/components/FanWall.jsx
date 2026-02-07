/**
 * MYSTATION - Fan Wall
 * Community comment wall for subscribers
 * Kathy and other paid fans can post here
 */

'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/playerStore';
import { MessageCircle, Send, Heart, Crown, Lock, Star } from 'lucide-react';

// Demo posts from the community
const DEMO_POSTS = [
  {
    id: 1,
    username: 'PageNation',
    content: 'Mike Page music got me through some tough times. Real talk, this man makes music for the soul! 🙏',
    likes: 42,
    createdAt: '2026-02-03',
    avatar: '👑',
    tier: 'vip'
  },
  {
    id: 2,
    username: 'ATLFan847',
    content: 'Just subscribed! Favorite Person on repeat all day. Worth every penny to support the Foundation.',
    likes: 28,
    createdAt: '2026-02-04',
    avatar: '🎧',
    tier: 'supporter'
  },
  {
    id: 3,
    username: 'DreamzFamily',
    content: 'Who else excited for new music dropping soon?? 👀🔥',
    likes: 35,
    createdAt: '2026-02-05',
    avatar: '⭐',
    tier: 'supporter'
  },
];

export default function FanWall() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [mounted, setMounted] = useState(false);

  const { isSubscribed } = useUserStore();

  useEffect(() => {
    setMounted(true);

    // Load saved posts
    const saved = localStorage.getItem('mystation-fan-wall');
    const savedLikes = localStorage.getItem('mystation-fan-wall-likes');
    const savedUsername = localStorage.getItem('mystation-fan-username');

    if (saved) {
      setPosts(JSON.parse(saved));
    } else {
      setPosts(DEMO_POSTS);
    }

    if (savedLikes) setLikedPosts(JSON.parse(savedLikes));
    if (savedUsername) setUsername(savedUsername);
  }, []);

  const handleSubmit = () => {
    if (!newPost.trim()) return;

    if (!username) {
      setShowNamePrompt(true);
      return;
    }

    const post = {
      id: Date.now(),
      username,
      content: newPost.trim(),
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      avatar: '🎤',
      tier: 'supporter'
    };

    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('mystation-fan-wall', JSON.stringify(updatedPosts));
    setNewPost('');
  };

  const handleSetUsername = () => {
    if (!username.trim()) return;
    localStorage.setItem('mystation-fan-username', username.trim());
    setShowNamePrompt(false);
    handleSubmit();
  };

  const handleLike = (postId) => {
    if (likedPosts.includes(postId)) return;

    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    setPosts(updatedPosts);
    localStorage.setItem('mystation-fan-wall', JSON.stringify(updatedPosts));

    const updatedLikes = [...likedPosts, postId];
    setLikedPosts(updatedLikes);
    localStorage.setItem('mystation-fan-wall-likes', JSON.stringify(updatedLikes));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTierBadge = (tier) => {
    if (tier === 'vip') return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (tier === 'foundation') return { icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/20' };
    return { icon: Heart, color: 'text-blue-400', bg: 'bg-blue-400/20' };
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(147,51,234,0.2), rgba(59,130,246,0.2))'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MessageCircle size={24} color="white" />
          </div>
          <div>
            <h3 style={{ color: 'white', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>
              Fan Wall
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Connect with the MyStation community
            </p>
          </div>
        </div>
      </div>

      {/* Post Input - Only for Subscribers */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {isSubscribed ? (
          showNamePrompt ? (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '12px' }}>
                Choose your display name:
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSetUsername}
                  disabled={!username.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: username.trim() ? '#9333ea' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: username.trim() ? 'pointer' : 'not-allowed',
                    opacity: username.trim() ? 1 : 0.5
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(147,51,234,0.3), rgba(59,130,246,0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '20px'
                }}
              >
                🎤
              </div>
              <input
                type="text"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Share your thoughts with the community..."
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '24px',
                  padding: '12px 20px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={!newPost.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: newPost.trim() ? '#9333ea' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                  color: 'white'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          )
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Lock size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: '600', margin: 0, fontSize: '14px' }}>
                Subscribe to join the conversation
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0 0' }}>
                $4.99/month - Support the Mike Page Foundation
              </p>
            </div>
            <a
              href="https://buy.stripe.com/eVq5kEcWS8VW8z10xs73G04"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                borderRadius: '20px',
                textDecoration: 'none'
              }}
            >
              Subscribe
            </a>
          </div>
        )}
      </div>

      {/* Posts */}
      <div style={{ padding: '16px 24px', maxHeight: '500px', overflowY: 'auto' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <MessageCircle size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>No posts yet</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '8px 0 0 0' }}>
              Be the first to share!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => {
              const tierBadge = getTierBadge(post.tier);
              const TierIcon = tierBadge.icon;

              return (
                <div
                  key={post.id}
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(147,51,234,0.3), rgba(59,130,246,0.3))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0
                      }}
                    >
                      {post.avatar}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                          {post.username}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: tierBadge.bg,
                            color: tierBadge.color
                          }}
                        >
                          <TierIcon size={10} />
                          {post.tier === 'vip' ? 'VIP' : post.tier === 'foundation' ? 'Foundation' : 'Supporter'}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                          {formatDate(post.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          margin: 0
                        }}
                      >
                        {post.content}
                      </p>

                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '10px',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          border: 'none',
                          backgroundColor: likedPosts.includes(post.id) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                          color: likedPosts.includes(post.id) ? '#ef4444' : 'rgba(255,255,255,0.5)',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        <Heart size={14} fill={likedPosts.includes(post.id) ? '#ef4444' : 'none'} />
                        {post.likes}
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
