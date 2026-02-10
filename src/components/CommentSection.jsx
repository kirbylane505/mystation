/**
 * MYSTATION - Comment Section
 * Dropdown comment panel for song pages
 * Glass morphism dark theme, API-backed
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send } from 'lucide-react';

function relativeTime(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function CommentSection({ trackId, trackTitle }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const hasFetched = useRef(false);

  // Restore saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('mystation-comment-name');
    if (savedName) setName(savedName);
  }, []);

  const fetchComments = useCallback(async () => {
    if (!trackId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?trackId=${encodeURIComponent(trackId)}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.comments || [];
        setComments(list);
        setCount(list.length);
      }
    } catch {
      // silent fail — comments are non-critical
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  // Fetch comment count on mount (lightweight)
  useEffect(() => {
    if (!trackId) return;
    fetch(`/api/comments?trackId=${encodeURIComponent(trackId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const list = Array.isArray(data) ? data : data.comments || [];
          setCount(list.length);
        }
      })
      .catch(() => {});
  }, [trackId]);

  // Full fetch when dropdown opens
  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true;
      fetchComments();
    }
  }, [open, fetchComments]);

  // Reset fetch flag when trackId changes
  useEffect(() => {
    hasFetched.current = false;
    setComments([]);
    setCount(0);
    setOpen(false);
  }, [trackId]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Scroll to bottom after posting
  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    const trimmedMsg = message.trim();
    if (!trimmedName || !trimmedMsg || submitting) return;

    // Save name for next time
    localStorage.setItem('mystation-comment-name', trimmedName);

    // Optimistic comment
    const optimistic = {
      id: `temp-${Date.now()}`,
      name: trimmedName,
      message: trimmedMsg,
      trackId,
      trackTitle,
      createdAt: new Date().toISOString(),
    };

    setComments(prev => [...prev, optimistic]);
    setCount(prev => prev + 1);
    setMessage('');
    setTimeout(scrollToBottom, 50);

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          trackTitle,
          name: trimmedName,
          message: trimmedMsg,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic with real data
        setComments(prev =>
          prev.map(c => (c.id === optimistic.id ? { ...optimistic, ...saved } : c))
        );
      }
    } catch {
      // Keep optimistic comment visible regardless
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Comment Button with Badge */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur transition-all duration-200 text-white/60 hover:text-white/90"
        aria-label="Toggle comments"
      >
        <MessageCircle size={18} />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white px-1 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute top-full left-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 origin-top ${
          open
            ? 'opacity-100 scale-y-100 translate-y-0'
            : 'opacity-0 scale-y-0 translate-y-[-8px] pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <MessageCircle size={14} className="text-blue-400" />
            Comments
            {count > 0 && (
              <span className="text-[11px] text-white/40 font-normal">({count})</span>
            )}
          </h3>
          {trackTitle && (
            <p className="text-[11px] text-white/30 mt-0.5 truncate">{trackTitle}</p>
          )}
        </div>

        {/* Comment List */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={28} className="mx-auto mb-2 text-white/15" />
              <p className="text-xs text-white/30">
                Be the first to comment on this track
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white/80 shrink-0">
                    {comment.name || comment.username}
                  </span>
                  <span className="text-[10px] text-white/25">
                    {relativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                  {comment.message || comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-white/10 bg-white/[0.02]"
        >
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              maxLength={30}
              className="w-20 shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a comment..."
              maxLength={500}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
            />
            <button
              type="submit"
              disabled={!name.trim() || !message.trim() || submitting}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white transition-all duration-200 disabled:cursor-not-allowed"
              aria-label="Send comment"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
