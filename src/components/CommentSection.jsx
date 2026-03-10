/**
 * MYSTATION - Premium Comment Section
 * Instagram/YouTube style with owner auto-detect,
 * profile avatars, hearts, pinned comments, threaded replies
 *
 * DB MIGRATION NEEDED (run in Supabase SQL editor):
 * ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
 * ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, Send, Trash2, Reply, ShieldCheck,
  X, Heart, Pin, CheckCircle2
} from 'lucide-react';
import { useUserStore } from '@/store/playerStore';

// ─── Constants ───────────────────────────────────────
const OWNER_EMAILS = [
  'idmgatl@gmail.com',
  'mystationlive@gmail.com',
  'pagemusic505@gmail.com'
];
const LIKED_KEY = 'mystation-liked-comments';

// ─── Utilities ───────────────────────────────────────

function relativeTime(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo` : `${Math.floor(mo / 12)}y`;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  'from-red-500 to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-fuchsia-600',
  'from-cyan-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-indigo-500 to-blue-600',
];

function getAvatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getLikedIds() {
  try { return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]'); }
  catch { return []; }
}

function toggleLikeLocal(id) {
  const liked = getLikedIds();
  const isLiked = liked.includes(id);
  localStorage.setItem(LIKED_KEY, JSON.stringify(
    isLiked ? liked.filter(x => x !== id) : [...liked, id]
  ));
  return !isLiked;
}

// ─── Avatar ──────────────────────────────────────────

function Avatar({ name, isAdmin, size = 36 }) {
  const initials = getInitials(name);
  const s = { width: size, height: size, fontSize: size * 0.36 };

  if (isAdmin) {
    return (
      <div
        className="shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-black ring-2 ring-amber-400/30"
        style={s}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full bg-gradient-to-br ${getAvatarGradient(name)} flex items-center justify-center font-bold text-white`}
      style={s}
    >
      {initials}
    </div>
  );
}

// ─── Badges ──────────────────────────────────────────

function OwnerBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <CheckCircle2 size={13} className="text-blue-400" fill="currentColor" strokeWidth={0} />
      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none">
        IDMG
      </span>
    </span>
  );
}

// ─── Heart Button ────────────────────────────────────

function HeartBtn({ count, liked, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 text-xs transition-all duration-200 ${
        liked ? 'text-red-500' : 'text-white/25 hover:text-red-400'
      }`}
    >
      <Heart
        size={14}
        fill={liked ? 'currentColor' : 'none'}
        className={`transition-transform duration-200 ${liked ? 'scale-110' : ''}`}
      />
      {count > 0 && <span className="text-[11px]">{count}</span>}
    </button>
  );
}

// ─── Comment Row ─────────────────────────────────────

function CommentRow({
  comment, isAdmin, likedIds, onLike, onReply, onDelete, onPin,
  replyingTo, replyMsg, setReplyMsg, onReplySubmit, onReplyCancel, submitting
}) {
  const liked = likedIds.includes(comment.id);

  return (
    <div className="group py-3">
      <div className="flex gap-3">
        <Avatar name={comment.name} isAdmin={comment.isAdmin} size={36} />
        <div className="flex-1 min-w-0">
          {/* Name + badge + time */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-bold ${comment.isAdmin ? 'text-blue-400' : 'text-white/90'}`}>
              {comment.name}
            </span>
            {comment.isAdmin && <OwnerBadge />}
            <span className="text-[11px] text-white/25">{relativeTime(comment.createdAt)}</span>
          </div>

          {/* Message */}
          <p className="text-sm text-white/70 leading-relaxed mt-1 break-words">
            {comment.message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <HeartBtn
              count={comment.likes || 0}
              liked={liked}
              onClick={() => onLike(comment.id)}
            />

            {isAdmin && !comment.isAdmin && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-[11px] text-white/25 hover:text-blue-400 flex items-center gap-1 transition"
              >
                <Reply size={12} /> Reply
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => onPin(comment.id, !comment.isPinned)}
                  className={`text-[11px] flex items-center gap-1 transition ${
                    comment.isPinned ? 'text-amber-400' : 'text-white/25 hover:text-amber-400'
                  }`}
                >
                  <Pin size={12} /> {comment.isPinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-[11px] text-white/25 hover:text-red-400 flex items-center gap-1 transition"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="ml-12 mt-3 space-y-3 border-l-2 border-white/5 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 group/reply">
              <Avatar name={reply.name} isAdmin={reply.isAdmin} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-bold ${reply.isAdmin ? 'text-blue-400' : 'text-white/80'}`}>
                    {reply.name}
                  </span>
                  {reply.isAdmin && <OwnerBadge />}
                  <span className="text-[10px] text-white/25">{relativeTime(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed mt-0.5 break-words">
                  {reply.message}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(reply.id, comment.id)}
                    className="text-[10px] text-white/20 hover:text-red-400 flex items-center gap-1 mt-1 opacity-0 group-hover/reply:opacity-100 transition"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      {replyingTo === comment.id && isAdmin && (
        <div className="ml-12 mt-3 flex gap-2 items-center border-l-2 border-blue-500/30 pl-4">
          <input
            type="text"
            value={replyMsg}
            onChange={(e) => setReplyMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onReplySubmit(comment); }}
            placeholder="Reply as Mike Page..."
            maxLength={500}
            autoFocus
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/40 transition"
          />
          <button
            onClick={() => onReplySubmit(comment)}
            disabled={!replyMsg.trim() || submitting}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-white/5 disabled:text-white/20 text-white transition"
          >
            <Send size={14} />
          </button>
          <button
            onClick={onReplyCancel}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/40 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Comment Panel (shared content for modal + inline) ───

function CommentPanel({ trackId, trackTitle, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreatorInput, setShowCreatorInput] = useState(false);
  const [creatorKey, setCreatorKey] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [likedIds, setLikedIds] = useState([]);
  const listRef = useRef(null);

  const storeSubscribed = useUserStore((s) => s.isSubscribed);
  const storeEmail = useUserStore((s) => s.email);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Auto-detect owner
  useEffect(() => {
    const email = (storeEmail || localStorage.getItem('mystation-email') || '').toLowerCase();
    if (OWNER_EMAILS.includes(email)) {
      sessionStorage.setItem('mystation-admin', 'true');
      setIsAdmin(true);
    } else if (sessionStorage.getItem('mystation-admin')) {
      setIsAdmin(true);
    }
    setIsSubscribed(storeSubscribed);
    setLikedIds(getLikedIds());
    const savedName = localStorage.getItem('mystation-comment-name');
    if (savedName) setName(savedName);
  }, [storeEmail, storeSubscribed]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!trackId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?trackId=${encodeURIComponent(trackId)}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.comments || [];
        setComments(list);
        onCountChange?.(list.filter((c) => !c.parentId).length);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [trackId, onCountChange]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { setReplyingTo(null); }, [trackId]);

  const canComment = isSubscribed || isAdmin;
  const getAdminKey = () => sessionStorage.getItem('mystation-admin-key') || '';

  // Post comment
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmedMsg = message.trim();
    const trimmedName = name.trim();
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
      likes: 0,
      isPinned: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setComments((prev) => [...prev, optimistic]);
    setMessage('');
    setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50);

    setSubmitting(true);
    try {
      const body = { trackId, trackTitle, name: isAdmin ? 'Mike Page' : trimmedName, message: trimmedMsg };
      if (isAdmin) body.adminKey = getAdminKey();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { comment: saved } = await res.json();
        if (saved) {
          setComments((prev) =>
            prev.map((c) => (c.id === optimistic.id ? { ...saved, replies: saved.replies || [] } : c))
          );
        }
      }
    } catch {
      // keep optimistic
    } finally {
      setSubmitting(false);
    }
  };

  // Reply
  const handleReply = async (parent) => {
    const msg = replyMsg.trim();
    if (!msg || submitting) return;

    const optimistic = {
      id: `reply-${Date.now()}`,
      name: 'Mike Page',
      message: msg,
      isAdmin: true,
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === parent.id ? { ...c, replies: [...(c.replies || []), optimistic] } : c
      )
    );
    setReplyMsg('');
    setReplyingTo(null);

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId, trackTitle, name: 'Mike Page', message: msg,
          parentId: parent.id, adminKey: getAdminKey(),
        }),
      });
      if (res.ok) {
        const { comment: saved } = await res.json();
        if (saved) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parent.id
                ? { ...c, replies: (c.replies || []).map((r) => (r.id === optimistic.id ? saved : r)) }
                : c
            )
          );
        }
      }
    } catch {
      // keep optimistic
    } finally {
      setSubmitting(false);
    }
  };

  // Like
  const handleLike = async (commentId) => {
    const nowLiked = toggleLikeLocal(commentId);
    setLikedIds(getLikedIds());
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, likes: Math.max(0, (c.likes || 0) + (nowLiked ? 1 : -1)) } : c
      )
    );
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nowLiked ? 'like' : 'unlike', commentId }),
      });
    } catch {
      // optimistic stays
    }
  };

  // Pin
  const handlePin = async (commentId, pin) => {
    setComments((prev) =>
      prev.map((c) => ({ ...c, isPinned: c.id === commentId ? pin : false }))
    );
    try {
      await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: pin ? 'pin' : 'unpin', commentId, adminKey: getAdminKey() }),
      });
    } catch {
      // optimistic stays
    }
  };

  // Delete
  const handleDelete = async (commentId, parentId = null) => {
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: (c.replies || []).filter((r) => r.id !== commentId) } : c
        )
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    try {
      await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, adminKey: getAdminKey() }),
      });
    } catch {
      // already removed
    }
  };

  // Creator mode login
  const handleCreatorLogin = (e) => {
    e.preventDefault();
    if (!creatorKey.trim()) return;
    sessionStorage.setItem('mystation-admin', 'true');
    sessionStorage.setItem('mystation-admin-key', creatorKey.trim());
    setIsAdmin(true);
    setShowCreatorInput(false);
    setCreatorKey('');
  };

  // Separate pinned and regular
  const pinned = comments.filter((c) => c.isPinned);
  const regular = comments.filter((c) => !c.isPinned);

  return (
    <div className="flex flex-col h-full">
      {/* Comment List */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain px-5 py-2 scrollbar-thin scrollbar-thumb-white/10"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle size={40} className="mx-auto mb-3 text-white/10" />
            <p className="text-sm text-white/30 font-medium">No comments yet</p>
            <p className="text-xs text-white/20 mt-1">
              {canComment ? 'Be the first to share your thoughts' : 'Subscribe to join the conversation'}
            </p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.map((c) => (
              <div key={c.id} className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 pt-1 pb-0 mb-3">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-widest pt-3 pb-1">
                  <Pin size={10} /> Pinned
                </div>
                <CommentRow
                  comment={c} isAdmin={isAdmin} likedIds={likedIds}
                  onLike={handleLike} onReply={setReplyingTo} onDelete={handleDelete} onPin={handlePin}
                  replyingTo={replyingTo} replyMsg={replyMsg} setReplyMsg={setReplyMsg}
                  onReplySubmit={handleReply} onReplyCancel={() => setReplyingTo(null)} submitting={submitting}
                />
              </div>
            ))}

            {/* Regular */}
            <div className="divide-y divide-white/5">
              {regular.map((c) => (
                <CommentRow
                  key={c.id} comment={c} isAdmin={isAdmin} likedIds={likedIds}
                  onLike={handleLike} onReply={setReplyingTo} onDelete={handleDelete} onPin={handlePin}
                  replyingTo={replyingTo} replyMsg={replyMsg} setReplyMsg={setReplyMsg}
                  onReplySubmit={handleReply} onReplyCancel={() => setReplyingTo(null)} submitting={submitting}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Input Area */}
      {canComment ? (
        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02] shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            {!isAdmin && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                maxLength={30}
                className="w-24 shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/40 transition"
              />
            )}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
              placeholder={isAdmin ? 'Comment as Mike Page...' : 'Drop a comment...'}
              maxLength={500}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-blue-500/40 transition"
            />
            <button
              type="submit"
              disabled={(!isAdmin && !name.trim()) || !message.trim() || submitting}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-white/5 disabled:text-white/20 text-white transition"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Creator Mode */}
          <div className="mt-3 flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                <ShieldCheck size={14} />
                Posting as Mike Page
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreatorInput((p) => !p)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition"
              >
                <ShieldCheck size={14} />
                Creator Mode
              </button>
            )}
          </div>

          {/* Creator key input */}
          {showCreatorInput && !isAdmin && (
            <form onSubmit={handleCreatorLogin} className="mt-3 flex gap-2">
              <input
                type="password"
                value={creatorKey}
                onChange={(e) => setCreatorKey(e.target.value)}
                placeholder="Enter creator key"
                autoFocus
                className="flex-1 bg-white/5 border border-amber-500/20 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/25 outline-none focus:border-amber-500/40 transition"
              />
              <button
                type="submit"
                disabled={!creatorKey.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-sm rounded-xl transition"
              >
                Go
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="px-5 py-6 border-t border-white/10 bg-white/[0.02] text-center shrink-0">
          <p className="text-sm text-white/40 mb-3">Subscribe to join the conversation</p>
          <a
            href="/subscribe"
            className="inline-block px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-full transition"
          >
            Subscribe
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────

export default function CommentSection({ trackId, trackTitle, modalMode = false }) {
  const [showModal, setShowModal] = useState(false);
  const [count, setCount] = useState(0);

  // Fetch count on mount (standard mode only)
  useEffect(() => {
    if (!trackId || modalMode) return;
    fetch(`/api/comments?trackId=${encodeURIComponent(trackId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.comments) setCount(data.comments.filter((c) => !c.parentId).length);
      })
      .catch(() => {});
  }, [trackId, modalMode]);

  // Modal mode: render inline
  if (modalMode) {
    return <CommentPanel trackId={trackId} trackTitle={trackTitle} />;
  }

  // Standard mode: button + modal
  return (
    <>
      {/* Comment trigger button */}
      <button
        onClick={() => setShowModal(true)}
        className="relative flex items-center gap-1.5 text-white/40 hover:text-white/70 transition"
        aria-label="Comments"
      >
        <MessageCircle size={18} />
        {count > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white px-1 leading-none">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full sm:max-w-lg max-h-[85vh] sm:max-h-[70vh] bg-[#0d1117] border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col z-10 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageCircle size={18} className="text-blue-400" />
                  Comments
                  {count > 0 && (
                    <span className="text-sm text-white/30 font-normal">({count})</span>
                  )}
                </h3>
                {trackTitle && (
                  <p className="text-xs text-white/30 mt-0.5 truncate max-w-[280px]">{trackTitle}</p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Panel */}
            <CommentPanel
              trackId={trackId}
              trackTitle={trackTitle}
              onCountChange={setCount}
            />
          </div>
        </div>
      )}
    </>
  );
}
