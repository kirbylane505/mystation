'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, Camera, Send, Loader2, ImageIcon, X, CheckCircle2 } from 'lucide-react';

function StarRating({ rating, onRate, size = 20, interactive = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            size={size}
            className={`transition-colors ${
              (hover || rating) >= star
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-white/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProductReviews({ productSlug, productName }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!productSlug) return;
    fetch(`/api/reviews?slug=${encodeURIComponent(productSlug)}`)
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews || []);
        setAvg(data.avg || 0);
        setCount(data.count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB');
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !review.trim() || rating < 1) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('slug', productSlug);
      formData.append('username', name.trim());
      formData.append('rating', rating);
      formData.append('review', review.trim());
      if (photo) formData.append('photo', photo);

      const res = await fetch('/api/reviews', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.review) {
        setReviews(prev => [data.review, ...prev]);
        setCount(prev => prev + 1);
        const newTotal = reviews.reduce((s, r) => s + r.rating, 0) + data.review.rating;
        setAvg(Math.round((newTotal / (count + 1)) * 10) / 10);
        setName('');
        setRating(0);
        setReview('');
        removePhoto();
        setShowForm(false);
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch {}
    setSubmitting(false);
  }

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Customer Reviews</h2>
          {count > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(avg)} size={16} />
              <span className="text-sm text-white/60">{avg} out of 5 ({count} review{count !== 1 ? 's' : ''})</span>
            </div>
          )}
          {count === 0 && !loading && (
            <p className="text-sm text-white/40">Be the first to review this product</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all"
        >
          Write a Review
        </button>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
          <p className="text-sm text-green-300">Thank you! Your review has been posted.</p>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Leave a Review</h3>

          {/* Rating */}
          <div className="mb-4">
            <label className="text-sm font-bold text-white/70 mb-2 block">Your Rating</label>
            <StarRating rating={rating} onRate={setRating} size={28} interactive />
            {rating === 0 && <p className="text-xs text-white/30 mt-1">Tap a star to rate</p>}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="text-sm font-bold text-white/70 mb-2 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="text-sm font-bold text-white/70 mb-2 block">Your Review</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Tell us what you think about this product..."
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 text-sm resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-5">
            <label className="text-sm font-bold text-white/70 mb-2 block">Photo of Your Product (optional)</label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-dashed border-white/20 hover:border-blue-500/50 hover:bg-white/[0.03] transition text-white/50 hover:text-white/70 text-sm"
              >
                <Camera size={18} />
                Upload a photo of your merch
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !name.trim() || !review.trim() || rating < 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${
                submitting || !name.trim() || !review.trim() || rating < 1
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-3 rounded-full text-sm text-white/50 hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/5">
          <ImageIcon size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{r.username}</span>
                    {r.isVerified && (
                      <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Verified Purchase</span>
                    )}
                  </div>
                  <StarRating rating={r.rating} size={14} />
                </div>
                <span className="text-xs text-white/30">{timeAgo(r.createdAt)}</span>
              </div>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">{r.review}</p>
              {r.photoUrl && (
                <button
                  onClick={() => setExpandedPhoto(r.photoUrl)}
                  className="mt-3 block"
                >
                  <img
                    src={r.photoUrl}
                    alt="Customer photo"
                    className="w-20 h-20 rounded-xl object-cover border border-white/10 hover:border-blue-500/50 transition cursor-pointer"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setExpandedPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10"
            >
              <X size={16} />
            </button>
            <img
              src={expandedPhoto}
              alt="Customer photo"
              className="w-full rounded-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
