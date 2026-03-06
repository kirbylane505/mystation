'use client';

import { useState } from 'react';
import { Heart, Reply, ChevronDown, ChevronUp, Crown, Star, Pin, BarChart3 } from 'lucide-react';

const REACTIONS = ['🔥', '💯', '❤️', '👏', '🙌', '💪'];

function formatDate(dateStr) {
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
}

function getBadge(tier) {
  if (tier === 'vip') return { label: 'MIKE PAGE', color: 'text-yellow-400', bg: 'bg-yellow-400/20', icon: Crown };
  if (tier === 'diamond') return { label: 'DIAMOND', color: 'text-cyan-400', bg: 'bg-cyan-400/20', icon: Star };
  if (tier === 'subscriber') return { label: 'SUB', color: 'text-purple-400', bg: 'bg-purple-400/20', icon: Star };
  return null;
}

function PollDisplay({ post, onVote }) {
  const options = post.poll_options?.options || [];
  const counts = post.poll_options?.counts || {};
  const myVote = post.poll_options?.myVote;
  const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="mt-3 space-y-2">
      {options.map((opt, i) => {
        const count = counts[i] || 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const voted = myVote === i;
        return (
          <button
            key={i}
            onClick={() => onVote(post.id, i)}
            disabled={myVote !== undefined}
            className={`w-full relative rounded-xl px-4 py-3 text-left text-sm transition overflow-hidden ${
              voted ? 'border border-purple-500/50 bg-purple-500/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            {myVote !== undefined && (
              <div className="absolute inset-y-0 left-0 bg-purple-500/15 transition-all duration-500" style={{ width: `${pct}%` }} />
            )}
            <span className="relative flex items-center justify-between">
              <span className="text-white/90">{opt}</span>
              {myVote !== undefined && <span className="text-white/50 text-xs">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-white/30 text-xs flex items-center gap-1">
        <BarChart3 size={12} /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default function CommunityPost({ post, onLike, onReply, onReact, onPin, onVote, isOwner, likedPosts = [] }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);

  const badge = getBadge(post.tier);
  const replies = post.replies || [];
  const reactions = post.reactions || [];
  const isVip = post.tier === 'vip';
  const isLiked = likedPosts.includes(post.id);

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(post.id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
    setRepliesExpanded(true);
  };

  return (
    <div className={`rounded-xl border transition ${
      isVip ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/20' : 'bg-white/5 border-white/5 hover:border-white/10'
    }`}>
      {post.is_pinned && (
        <div className="px-4 pt-2 flex items-center gap-1 text-yellow-400 text-xs font-semibold">
          <Pin size={12} /> Pinned
        </div>
      )}
      <div className="p-4">
        <div className="flex gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
            isVip ? 'bg-gradient-to-br from-yellow-500/40 to-amber-500/30 ring-2 ring-yellow-500/30' : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30'
          }`}>
            {isVip ? '👑' : (post.avatar || '🎤')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`font-semibold text-sm ${isVip ? 'text-yellow-400' : 'text-white'}`}>{post.username}</span>
              {badge && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.color}`}>
                  <badge.icon size={10} />
                  {badge.label}
                </span>
              )}
              <span className="text-white/30 text-xs">{formatDate(post.created_at)}</span>
            </div>
            <p className="text-white/85 text-sm leading-relaxed">{post.content}</p>
            {post.post_type === 'photo' && post.media_url && (
              <div className="mt-3 rounded-xl overflow-hidden max-h-80">
                <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            {post.post_type === 'poll' && post.poll_options && <PollDisplay post={post} onVote={onVote} />}
            {reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {reactions.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-sm" title={`${r.by} reacted`}>{r.emoji}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2.5">
              <button onClick={() => onLike(post.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
                <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} /> {post.likes || 0}
              </button>
              <button onClick={() => setReplyOpen(!replyOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-white/5 text-white/50 hover:bg-white/10 transition">
                <Reply size={13} /> Reply{replies.length > 0 ? ` (${replies.length})` : ''}
              </button>
              {isOwner && (
                <div className="flex gap-1 ml-auto items-center">
                  <button onClick={() => onPin(post.id, !post.is_pinned)} className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition hover:scale-110 ${post.is_pinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                    <Pin size={12} />
                  </button>
                  {REACTIONS.map(emoji => (
                    <button key={emoji} onClick={() => onReact(post.id, emoji)} className="w-7 h-7 rounded-full bg-white/5 hover:bg-yellow-500/20 flex items-center justify-center text-sm transition hover:scale-110">{emoji}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="border-t border-white/5">
          <button onClick={() => setRepliesExpanded(!repliesExpanded)} className="w-full px-4 py-2 flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition">
            {repliesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>
          {repliesExpanded && (
            <div className="px-4 pb-3 space-y-3">
              {replies.map(reply => (
                <div key={reply.id} className="flex gap-2 pl-6 border-l-2 border-purple-500/20">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-sm shrink-0">{reply.avatar || '💬'}</div>
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
      {replyOpen && (
        <div className="px-4 pb-3 border-t border-white/5 pt-3">
          <div className="flex gap-2 pl-6">
            <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleReply()} placeholder="Write a reply..." maxLength={300} autoFocus className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-xs outline-none focus:border-purple-500/50" />
            <button onClick={handleReply} disabled={!replyText.trim()} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 text-white text-xs font-semibold rounded-full transition">Reply</button>
          </div>
        </div>
      )}
    </div>
  );
}
