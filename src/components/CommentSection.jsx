/**
 * MYSTATION - Comment Section
 * YouTube-style comments on songs
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ThumbsUp, Reply, Send, User, MoreHorizontal, Trash2, Flag, X } from 'lucide-react';

// Demo comments (will be Supabase later)
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
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [likedComments, setLikedComments] = useState([]);

  // Load comments
  useEffect(() => {
    const saved = localStorage.getItem(`mystation-comments-${trackId}`);
    const savedLikes = localStorage.getItem('mystation-liked-comments');
    const savedUsername = localStorage.getItem('mystation-username');

    if (saved) {
      setComments(JSON.parse(saved));
    } else {
      setComments(DEMO_COMMENTS[trackId] || []);
    }

    if (savedLikes) {
      setLikedComments(JSON.parse(savedLikes));
    }

    if (savedUsername) {
      setUsername(savedUsername);
    }
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
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-mystation-navy border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle size={20} className="text-blue-400" />
              Comments
            </h2>
            <p className="text-white/50 text-sm">{trackTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No comments yet</p>
              <p className="text-white/30 text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-lg shrink-0">
                  {comment.avatar}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{comment.username}</span>
                    <span className="text-white/30 text-xs">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 text-xs transition ${
                        likedComments.includes(comment.id)
                          ? 'text-blue-400'
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <ThumbsUp size={14} />
                      {comment.likes}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition">
                      <Reply size={14} />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          {showNamePrompt ? (
            <div className="space-y-3">
              <p className="text-white/60 text-sm">Enter your display name to comment:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-4 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleSetUsername}
                  disabled={!username.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <User size={18} className="text-blue-400" />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl py-2 px-4 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                  className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
