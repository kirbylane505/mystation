/**
 * MYSTATION - Comment Section
 * Clean, modern comments on songs
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, Send, User, X, Heart } from 'lucide-react';

// Demo comments
const DEMO_COMMENTS = {
  1: [
    { id: 1, username: 'ATLFan847', content: 'This track is FIRE! Been playing on repeat all week 🔥', likes: 24, createdAt: '2026-01-28', avatar: '🎧' },
    { id: 2, username: 'PageNation', content: 'Live Like A King hits different. Mike Page always delivering real music.', likes: 18, createdAt: '2026-01-29', avatar: '👑' },
  ],
  2: [
    { id: 3, username: 'MusicLover404', content: 'Very Special is that perfect vibe. Production is clean!', likes: 12, createdAt: '2026-01-30', avatar: '🎵' },
  ],
  100: [
    { id: 4, username: 'ChiTownVibes', content: 'Favorite Person is already a classic. Cubist production crazy on this one!', likes: 45, createdAt: '2026-02-01', avatar: '💜' },
    { id: 5, username: 'LOTLCrew', content: 'Cant wait to hear this live at Love on the Lawn!', likes: 31, createdAt: '2026-02-02', avatar: '🌿' },
    { id: 6, username: 'DreamzFan', content: 'Mike Page never misses. Support the Foundation! 🙏', likes: 22, createdAt: '2026-02-03', avatar: '⭐' },
  ],
};

export default function CommentSection({ trackId, trackTitle, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [likedComments, setLikedComments] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(`mystation-comments-${trackId}`);
    const savedLikes = localStorage.getItem('mystation-liked-comments');
    const savedUsername = localStorage.getItem('mystation-username');

    if (saved) {
      setComments(JSON.parse(saved));
    } else {
      setComments(DEMO_COMMENTS[trackId] || []);
    }

    if (savedLikes) setLikedComments(JSON.parse(savedLikes));
    if (savedUsername) setUsername(savedUsername);
  }, [trackId]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    if (!username) {
      setShowNamePrompt(true);
      return;
    }

    const comment = {
      id: Date.now(),
      username,
      content: newComment.trim(),
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      avatar: '🎤',
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    localStorage.setItem(`mystation-comments-${trackId}`, JSON.stringify(updatedComments));
    setNewComment('');
  };

  const handleSetUsername = () => {
    if (!username.trim()) return;
    localStorage.setItem('mystation-username', username.trim());
    setShowNamePrompt(false);
    handleSubmit();
  };

  const handleLike = (commentId) => {
    if (likedComments.includes(commentId)) return;

    const updatedComments = comments.map(c =>
      c.id === commentId ? { ...c, likes: c.likes + 1 } : c
    );
    setComments(updatedComments);
    localStorage.setItem(`mystation-comments-${trackId}`, JSON.stringify(updatedComments));

    const updatedLikes = [...likedComments, commentId];
    setLikedComments(updatedLikes);
    localStorage.setItem('mystation-liked-comments', JSON.stringify(updatedLikes));
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          backgroundColor: '#0f172a',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#1e293b'
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <MessageCircle size={20} style={{ color: '#3b82f6' }} />
              Comments
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0 0 0' }}>
              {trackTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Comments List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px'
        }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <MessageCircle size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>No comments yet</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: '8px 0 0 0' }}>
                Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {comment.avatar}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                        {comment.username}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {comment.content}
                    </p>

                    {/* Like Button */}
                    <button
                      onClick={() => handleLike(comment.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '8px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: likedComments.includes(comment.id) ? 'rgba(239,68,68,0.2)' : 'transparent',
                        color: likedComments.includes(comment.id) ? '#ef4444' : 'rgba(255,255,255,0.4)',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      <Heart size={14} fill={likedComments.includes(comment.id) ? '#ef4444' : 'none'} />
                      {comment.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#1e293b'
        }}>
          {showNamePrompt ? (
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '12px' }}>
                Enter your name to comment:
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
                    backgroundColor: username.trim() ? '#3b82f6' : 'rgba(255,255,255,0.1)',
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
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(59,130,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} style={{ color: '#3b82f6' }} />
              </div>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Add a comment..."
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
                disabled={!newComment.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: newComment.trim() ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                  color: 'white'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
