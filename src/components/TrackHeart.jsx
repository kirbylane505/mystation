'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { getVisitorId } from '@/store/videoStore';

export default function TrackHeart({ itemId, size = 16 }) {
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const vid = getVisitorId();
    fetch(`/api/video-likes?videoId=${encodeURIComponent(itemId)}&visitorId=${encodeURIComponent(vid)}`)
      .then(r => r.json())
      .then(d => { setLikes(d.likes || 0); setLiked(!!d.liked); })
      .catch(() => {});
  }, [itemId]);

  const toggle = useCallback((e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes(prev => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    fetch('/api/video-likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: itemId, visitorId: getVisitorId() }),
    })
      .then(r => r.json())
      .then(d => { setLikes(d.likes ?? 0); setLiked(!!d.liked); })
      .catch(() => { setLiked(wasLiked); setLikes(prev => wasLiked ? prev + 1 : Math.max(0, prev - 1)); })
      .finally(() => setBusy(false));
  }, [itemId, liked, busy]);

  return (
    <button onClick={toggle} className="flex items-center gap-0.5 transition" aria-label={liked ? 'Unlike' : 'Like'}>
      <Heart
        size={size}
        className={liked ? 'text-red-500' : 'text-white/40 hover:text-red-400'}
        fill={liked ? 'currentColor' : 'none'}
      />
      {likes > 0 && <span className="text-[11px] text-white/50">{likes}</span>}
    </button>
  );
}
