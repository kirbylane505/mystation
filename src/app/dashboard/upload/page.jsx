'use client';

import { useState, useEffect, useRef } from 'react';

const MUSIC_CATEGORIES = ['musician', 'producer', 'dj'];

export default function UploadPage() {
  const [category, setCategory] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', artist: '', album: '', producer: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const inputRef = useRef(null);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  useEffect(() => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => { if (d.creator) setCategory(d.creator.category); })
      .catch(() => {});
  }, []);

  const isMusic = MUSIC_CATEGORIES.includes(category);

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    const email = getEmail();
    if (!email || !file) return;
    setUploading(true);

    try {
      if (isMusic) {
        // Track upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', form.title);
        formData.append('artist', form.artist);
        formData.append('album', form.album);
        formData.append('producer', form.producer);
        formData.append('email', email);

        const res = await fetch('/api/creators/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Upload failed'); }
        else {
          setResult({ type: 'track', item: data.track });
          setForm({ title: '', artist: '', album: '', producer: '', description: '' });
          setFile(null);
          if (inputRef.current) inputRef.current.value = '';
        }
      } else {
        // Video upload — 2-step: get presigned URL, then upload directly to R2
        setUploadProgress('Getting upload URL...');

        const res = await fetch('/api/creators/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            title: form.title,
            description: form.description,
            filename: file.name,
            contentType: file.type,
          }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Upload failed'); setUploadProgress(null); return; }

        // Upload directly to Supabase Storage via signed URL
        setUploadProgress('Uploading video...');
        const putRes = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type || 'video/mp4',
            ...(data.token ? { 'x-upsert': 'true' } : {}),
          },
        });

        if (!putRes.ok) {
          const errText = await putRes.text().catch(() => '');
          console.error('[video-upload] PUT failed:', putRes.status, errText);
          setError(`Video upload failed (${putRes.status}). Try again.`);
          setUploadProgress(null);
          return;
        }

        setUploadProgress(null);
        setResult({ type: 'video', item: data.video });
        setForm({ title: '', artist: '', album: '', producer: '', description: '' });
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    } catch (err) {
      console.error('[upload] Error:', err);
      setError(`Upload failed: ${err.message || 'Network error'}`);
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  if (category === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{isMusic ? 'Upload Music' : 'Upload Video'}</h1>

      <form onSubmit={handleUpload} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">
            {isMusic ? 'Audio File (M4A, MP3, WAV)' : 'Video File (MP4, MOV, WebM)'}
          </label>
          <input
            ref={inputRef}
            type="file"
            accept={isMusic ? 'audio/*' : 'video/*'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-[#a1a1aa] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:text-black file:font-medium file:cursor-pointer"
          />
          {file && <p className="text-xs text-[#71717a] mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">{isMusic ? 'Track Title' : 'Video Title'}</label>
          <input type="text" required value={form.title} onChange={update('title')}
            placeholder={isMusic ? 'Song name' : 'e.g., Full Body HIIT Workout'}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        {isMusic ? (
          <>
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-1">Artist Name</label>
              <input type="text" required value={form.artist} onChange={update('artist')}
                className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1">Album (optional)</label>
                <input type="text" value={form.album} onChange={update('album')}
                  className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#a1a1aa] mb-1">Producer (optional)</label>
                <input type="text" value={form.producer} onChange={update('producer')}
                  className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Description (optional)</label>
            <textarea rows={3} value={form.description} onChange={update('description')}
              placeholder="What's this video about?"
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none resize-none" />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {uploadProgress && <p className="text-[#D4AF37] text-sm">{uploadProgress}</p>}
        {result && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
            <p className="text-green-400 text-sm font-medium mb-3">
              Uploaded: {result.item?.title || form.title}
            </p>
            <button
              type="button"
              onClick={() => { setResult(null); setError(''); }}
              className="px-4 py-2 bg-[#D4AF37] text-black font-bold text-sm rounded-lg hover:bg-[#b8962e] transition-all"
            >
              Upload Another
            </button>
          </div>
        )}

        {!result && (
          <button
            type="submit"
            disabled={uploading || !file || !form.title || (isMusic && !form.artist)}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all"
          >
            {uploading ? (uploadProgress || 'Uploading...') : isMusic ? 'Upload Track' : 'Upload Video'}
          </button>
        )}
      </form>
    </div>
  );
}
