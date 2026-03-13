'use client';

import { useState, useRef } from 'react';

export default function UploadMusic() {
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', artist: '', album: '', producer: '' });
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const getEmail = () => {
    return document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const email = getEmail();
    if (!email || !file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', form.title);
    formData.append('artist', form.artist);
    formData.append('album', form.album);
    formData.append('producer', form.producer);
    formData.append('email', decodeURIComponent(email));

    try {
      const res = await fetch('/api/creators/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
      } else {
        setResult(data.track);
        setForm({ title: '', artist: '', album: '', producer: '' });
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
      }
    } catch (err) {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Upload Music</h1>

      <form onSubmit={handleUpload} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Audio File (M4A, MP3, WAV)</label>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-[#a1a1aa] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:text-black file:font-medium file:cursor-pointer"
          />
          {file && <p className="text-xs text-[#71717a] mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Track Title</label>
          <input type="text" required value={form.title} onChange={update('title')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

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

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {result && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
            <p className="text-green-400 text-sm font-medium">Uploaded: {result.title}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !form.title || !form.artist}
          className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all"
        >
          {uploading ? 'Uploading...' : 'Upload Track'}
        </button>
      </form>
    </div>
  );
}
