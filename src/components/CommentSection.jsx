/**
 * MYSTATION - Premium Comment Section
 * Subscriber-only commenting with admin replies
 * Glass morphism dark theme, Supabase-backed
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, Trash2, Reply, ShieldCheck, Lock, X, CheckCircle2 } from 'lucide-react';

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

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-1.5">
      <CheckCircle2 size={12} className="text-blue-400" fill="currentColor" strokeWidth={0} />
      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none">
        IDMG
      </span>
    </span>
  );
}

export default function CommentSection({ trackId, trackTitle, modalMode = false }) {
  const [open, setOpen] = useState(modalMode);
  const [comments, setComments] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const hasFetched = useRef(false);

  // Restore saved name + check sub status + admin session
  useEffect(() => {
    const savedName = localStorage.getItem('mystation-comment-name');
    if (savedName) setName(savedName);

    // Check subscription via cookie presence (server validates on POST)
    const hasSub = document.cookie.split(';').some(c => c.trim().startsWith('mystation-sub='));
    setIsSubscribed(hasSub);

    // Check admin session
    const adminSession = sessionStorage.getItem('mystation-admin');
    if (adminSession) setIsAdmin(true);
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
        // Count top-level only
        setCount(list.length);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  // Fetch comment count on mount
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

  // Full fetch when dropdown opens (or immediately in modal mode)
  useEffect(() => {
    if ((open || modalMode) && !hasFetched.current) {
      hasFetched.current = true;
      fetchComments();
    }
  }, [open, modalMode, fetchComments]);

  // Reset when trackId changes
  useEffect(() => {
    hasFetched.current = false;
    setComments([]);
    setCount(0);
    if (!modalMode) setOpen(false);
    setReplyingTo(null);
  }, [trackId, modalMode]);

  // Close on outside click (skip in modal mode — parent handles closing)
  useEffect(() => {
    if (!open || modalMode) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, modalMode]);

  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  const getAdminKey = () => sessionStorage.getItem('mystation-admin-key') || '';

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const key = adminKeyInput.trim();
    if (!key) return;
    // Store key — server validates on each request
    sessionStorage.setItem('mystation-admin', 'true');
    sessionStorage.setItem('mystation-admin-key', key);
    setIsAdmin(true);
    setShowAdminInput(false);
    setAdminKeyInput('');
    setAdminError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    const trimmedMsg = message.trim();
    if (!trimmedMsg || submitting) return;
    if (!isAdmin && !trimmedName) return;

    if (!isAdmin) localStorage.setItem('mystation-comment-name', trimmedName);

    const optimistic = {
      id: `temp-${Date.now()}`,
      name: isAdmin ? 'Mike Page' : trimmedName,
      message: trimmedMsg,
      trackId,
      isAdmin,
      role: isAdmin ? 'admin' : 'fan',
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments(prev => [...prev, optimistic]);
    setCount(prev => prev + 1);
    setMessage('');
    setTimeout(scrollToBottom, 50);

    setSubmitting(true);
    try {
      const body = {
        trackId,
        trackTitle,
        name: isAdmin ? 'Mike Page' : trimmedName,
        message: trimmedMsg,
      };
      if (isAdmin) body.adminKey = getAdminKey();

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { comment: saved } = await res.json();
        if (saved) {
          setComments(prev =>
            prev.map(c => (c.id === optimistic.id ? { ...saved, replies: saved.replies || [] } : c))
          );
        }
      } else if (res.status === 401) {
        // Admin key was wrong — clear session
        sessionStorage.removeItem('mystation-admin');
        sessionStorage.removeItem('mystation-admin-key');
        setIsAdmin(false);
        setComments(prev => prev.filter(c => c.id !== optimistic.id));
        setCount(prev => prev - 1);
      }
    } catch {
      // Keep optimistic
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentComment) => {
    const trimmedMsg = replyMessage.trim();
    if (!trimmedMsg || submitting) return;

    const optimisticReply = {
      id: `temp-reply-${Date.now()}`,
      name: 'Mike Page',
      message: trimmedMsg,
      parentId: parentComment.id,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    // Add reply to parent
    setComments(prev =>
      prev.map(c =>
        c.id === parentComment.id
          ? { ...c, replies: [...(c.replies || []), optimisticReply] }
          : c
      )
    );
    setReplyMessage('');
    setReplyingTo(null);

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId,
          trackTitle,
          name: 'Mike Page',
          message: trimmedMsg,
          parentId: parentComment.id,
          adminKey: getAdminKey(),
        }),
      });

      if (res.ok) {
        const { comment: saved } = await res.json();
        if (saved) {
          setComments(prev =>
            prev.map(c =>
              c.id === parentComment.id
                ? { ...c, replies: (c.replies || []).map(r => r.id === optimisticReply.id ? saved : r) }
                : c
            )
          );
        }
      }
    } catch {
      // Keep optimistic
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId, parentId = null) => {
    if (!confirm('Delete this comment?')) return;

    if (parentId) {
      // Remove reply from parent
      setComments(prev =>
        prev.map(c =>
          c.id === parentId
            ? { ...c, replies: (c.replies || []).filter(r => r.id !== commentId) }
            : c
        )
      );
    } else {
      // Remove top-level comment
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCount(prev => prev - 1);
    }

    try {
      await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, adminKey: getAdminKey() }),
      });
    } catch {
      // Already removed from UI
    }
  };

  const canComment = isSubscribed || isAdmin;

  // --- Modal mode: render content directly (no button, no dropdown wrapper) ---
  if (modalMode) {
    return (
      <div className="flex flex-col h-full" ref={panelRef}>
        {/* Comment List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={28} className="mx-auto mb-2 text-white/15" />
              <p className="text-xs text-white/30">
                {canComment ? 'Be the first to comment on this track' : 'No comments yet'}
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold shrink-0 ${comment.isAdmin ? 'text-blue-400' : 'text-white/80'}`}>
                        {comment.name || comment.username}
                      </span>
                      {comment.isAdmin && <AdminBadge />}
                      <span className="text-[10px] text-white/25">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                      {comment.message || comment.content}
                    </p>
                    {isAdmin && !comment.isAdmin && (
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => { setReplyingTo(comment.id); setReplyMessage(''); }}
                          className="text-[10px] text-blue-400/70 hover:text-blue-400 flex items-center gap-1"
                        >
                          <Reply size={10} /> Reply
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    )}
                    {isAdmin && comment.isAdmin && (
                      <div className="flex items-center gap-3 mt-1">
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2 border-l border-white/10 pl-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold shrink-0 ${reply.isAdmin ? 'text-blue-400' : 'text-white/80'}`}>
                            {reply.name || reply.username}
                          </span>
                          {reply.isAdmin && <AdminBadge />}
                          <span className="text-[10px] text-white/25">
                            {relativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                          {reply.message || reply.content}
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(reply.id, comment.id)}
                            className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1 mt-1"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {replyingTo === comment.id && isAdmin && (
                  <div className="ml-4 mt-2 flex gap-2 items-center border-l border-blue-500/30 pl-3">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReply(comment); }}
                      placeholder="Reply as Mike Page..."
                      maxLength={500}
                      autoFocus
                      className="flex-1 min-w-0 bg-white/5 border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
                    />
                    <button
                      onClick={() => handleReply(comment)}
                      disabled={!replyMessage.trim() || submitting}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white transition disabled:cursor-not-allowed"
                    >
                      <Send size={12} />
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {canComment ? (
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-white/10 bg-white/[0.02] shrink-0"
          >
            <div className="flex gap-2 items-center">
              {!isAdmin && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  maxLength={30}
                  className="w-20 shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
                />
              )}
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAdmin ? 'Comment as Mike Page...' : 'Add a comment...'}
                maxLength={500}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
              />
              <button
                type="submit"
                disabled={(!isAdmin && !name.trim()) || !message.trim() || submitting}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white transition-all duration-200 disabled:cursor-not-allowed"
                aria-label="Send comment"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              {isAdmin ? (
                <div className="flex items-center gap-1.5 text-[10px] text-green-400/70">
                  <ShieldCheck size={12} />
                  <span>Admin Mode</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdminInput(prev => !prev)}
                  className="flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/40 transition"
                >
                  <Lock size={10} />
                  <span>Admin</span>
                </button>
              )}
            </div>
            {showAdminInput && !isAdmin && (
              <form onSubmit={handleAdminLogin} className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => { setAdminKeyInput(e.target.value); setAdminError(''); }}
                  placeholder="Admin key"
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-purple-500/50 transition"
                />
                <button
                  type="submit"
                  disabled={!adminKeyInput.trim()}
                  className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-white text-xs rounded-lg transition"
                >
                  Go
                </button>
              </form>
            )}
            {adminError && (
              <p className="text-red-400 text-[10px] mt-1">{adminError}</p>
            )}
          </form>
        ) : (
          <div className="px-4 py-4 border-t border-white/10 bg-white/[0.02] text-center shrink-0">
            <div className="flex items-center justify-center gap-2 text-white/40 mb-2">
              <Lock size={14} />
              <span className="text-xs font-medium">Subscribe to join the conversation</span>
            </div>
            <a
              href="/subscribe"
              className="inline-block px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-full transition"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
    );
  }

  // --- Standard mode: button + dropdown ---
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
        className={`absolute top-full left-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 origin-top ${
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
          className="max-h-[350px] overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={28} className="mx-auto mb-2 text-white/15" />
              <p className="text-xs text-white/30">
                {canComment ? 'Be the first to comment on this track' : 'No comments yet'}
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="group">
                {/* Top-level comment */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold shrink-0 ${comment.isAdmin ? 'text-blue-400' : 'text-white/80'}`}>
                        {comment.name || comment.username}
                      </span>
                      {comment.isAdmin && <AdminBadge />}
                      <span className="text-[10px] text-white/25">
                        {relativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                      {comment.message || comment.content}
                    </p>

                    {/* Admin actions */}
                    {isAdmin && !comment.isAdmin && (
                      <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => { setReplyingTo(comment.id); setReplyMessage(''); }}
                          className="text-[10px] text-blue-400/70 hover:text-blue-400 flex items-center gap-1"
                        >
                          <Reply size={10} /> Reply
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    )}
                    {/* Admin can delete their own replies too */}
                    {isAdmin && comment.isAdmin && (
                      <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 mt-2 space-y-2 border-l border-white/10 pl-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="group/reply">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold shrink-0 ${reply.isAdmin ? 'text-blue-400' : 'text-white/80'}`}>
                            {reply.name || reply.username}
                          </span>
                          {reply.isAdmin && <AdminBadge />}
                          <span className="text-[10px] text-white/25">
                            {relativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                          {reply.message || reply.content}
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(reply.id, comment.id)}
                            className="text-[10px] text-red-400/50 hover:text-red-400 flex items-center gap-1 mt-1 opacity-0 group-hover/reply:opacity-100 transition"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline reply input */}
                {replyingTo === comment.id && isAdmin && (
                  <div className="ml-4 mt-2 flex gap-2 items-center border-l border-blue-500/30 pl-3">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReply(comment); }}
                      placeholder="Reply as Mike Page..."
                      maxLength={500}
                      autoFocus
                      className="flex-1 min-w-0 bg-white/5 border border-blue-500/30 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
                    />
                    <button
                      onClick={() => handleReply(comment)}
                      disabled={!replyMessage.trim() || submitting}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white transition disabled:cursor-not-allowed"
                    >
                      <Send size={12} />
                    </button>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        {canComment ? (
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-white/10 bg-white/[0.02]"
          >
            <div className="flex gap-2 items-center">
              {!isAdmin && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  maxLength={30}
                  className="w-20 shrink-0 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
                />
              )}
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAdmin ? 'Comment as Mike Page...' : 'Add a comment...'}
                maxLength={500}
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/50 transition"
              />
              <button
                type="submit"
                disabled={(!isAdmin && !name.trim()) || !message.trim() || submitting}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/80 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/20 text-white transition-all duration-200 disabled:cursor-not-allowed"
                aria-label="Send comment"
              >
                <Send size={14} />
              </button>
            </div>

            {/* Admin mode toggle */}
            <div className="mt-2 flex items-center justify-between">
              {isAdmin ? (
                <div className="flex items-center gap-1.5 text-[10px] text-green-400/70">
                  <ShieldCheck size={12} />
                  <span>Admin Mode</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdminInput(prev => !prev)}
                  className="flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/40 transition"
                >
                  <Lock size={10} />
                  <span>Admin</span>
                </button>
              )}
            </div>

            {/* Admin key input */}
            {showAdminInput && !isAdmin && (
              <form onSubmit={handleAdminLogin} className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => { setAdminKeyInput(e.target.value); setAdminError(''); }}
                  placeholder="Admin key"
                  autoFocus
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/25 outline-none focus:border-purple-500/50 transition"
                />
                <button
                  type="submit"
                  disabled={!adminKeyInput.trim()}
                  className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 disabled:opacity-50 text-white text-xs rounded-lg transition"
                >
                  Go
                </button>
              </form>
            )}
            {adminError && (
              <p className="text-red-400 text-[10px] mt-1">{adminError}</p>
            )}
          </form>
        ) : (
          /* Non-subscriber CTA */
          <div className="px-4 py-4 border-t border-white/10 bg-white/[0.02] text-center">
            <div className="flex items-center justify-center gap-2 text-white/40 mb-2">
              <Lock size={14} />
              <span className="text-xs font-medium">Subscribe to join the conversation</span>
            </div>
            <a
              href="/subscribe"
              className="inline-block px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-full transition"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
