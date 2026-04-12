'use client';

import { useState, useRef } from 'react';
import { Send, Image, BarChart3, X, RefreshCw, Lock } from 'lucide-react';

export default function CreatePost({ channel, username, isOwner, isSubscriber, onPost }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  if (!isSubscriber && !isOwner) {
    return (
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <Lock size={20} className="text-purple-400 shrink-0" />
          <div>
            <p className="text-white/70 text-sm font-medium">Subscribe to join the conversation</p>
            <p className="text-white/40 text-xs">$4.99/mo. Post, reply, and connect with the community.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setPostType('photo');
  };

  const handleSubmit = async () => {
    if (!content.trim() && postType !== 'poll') return;
    if (postType === 'poll' && pollOptions.filter(o => o.trim()).length < 2) return;
    setPosting(true);
    try {
      let media_url = null;
      if (postType === 'photo' && imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/community/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.url) { media_url = uploadData.url; }
        else { alert('Image upload failed'); setPosting(false); return; }
      }
      const body = {
        username, content: content.trim(), avatar: isOwner ? '👑' : '🎤',
        channel, post_type: postType, media_url,
        poll_options: postType === 'poll' ? { options: pollOptions.filter(o => o.trim()) } : null,
      };
      if (isOwner) body.ownerSecret = localStorage.getItem('mystation-fan-wall-token');
      await onPost(body);
      setContent(''); setPostType('text'); setImageFile(null); setImagePreview(null); setPollOptions(['', '']);
    } finally { setPosting(false); }
  };

  return (
    <div className="p-4 border-b border-white/10">
      <div className="flex gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
          isOwner ? 'bg-gradient-to-br from-yellow-500/40 to-amber-500/30' : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30'
        }`}>{isOwner ? '👑' : '🎤'}</div>
        <div className="flex-1">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={channel === 'announcements' ? 'Make an announcement...' : 'Share your thoughts...'} maxLength={500} rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-purple-500/50 resize-none" />
          {imagePreview && (
            <div className="relative mt-2 rounded-xl overflow-hidden max-h-48">
              <img src={imagePreview} alt="" className="w-full object-cover" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); setPostType('text'); }} className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center">
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
          {postType === 'poll' && (
            <div className="mt-2 space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={opt} onChange={(e) => { const u = [...pollOptions]; u[i] = e.target.value; setPollOptions(u); }} placeholder={`Option ${i + 1}`} maxLength={80} className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-purple-500/50" />
                  {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400"><X size={14} /></button>}
                </div>
              ))}
              {pollOptions.length < 4 && <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-purple-400 text-xs hover:text-purple-300">+ Add option</button>}
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileRef.current?.click()} className={`p-2 rounded-lg transition ${postType === 'photo' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}><Image size={16} /></button>
              <button onClick={() => setPostType(postType === 'poll' ? 'text' : 'poll')} className={`p-2 rounded-lg transition ${postType === 'poll' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}><BarChart3 size={16} /></button>
            </div>
            <button onClick={handleSubmit} disabled={(!content.trim() && postType !== 'poll') || posting} className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-white/10 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition flex items-center gap-2">
              {posting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
