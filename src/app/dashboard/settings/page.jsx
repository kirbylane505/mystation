'use client';

import { useState, useEffect } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'musician', label: 'Musician' },
  { value: 'podcaster', label: 'Podcaster' },
  { value: 'producer', label: 'Producer' },
  { value: 'dj', label: 'DJ' },
  { value: 'fitness_wellness', label: 'Fitness & Wellness' },
  { value: 'barber_stylist', label: 'Barber / Stylist' },
  { value: 'visual_artist', label: 'Visual Artist' },
  { value: 'chef_food', label: 'Chef / Food' },
  { value: 'educator_coach', label: 'Educator / Coach' },
  { value: 'comedian', label: 'Comedian' },
  { value: 'model_fashion', label: 'Model / Fashion' },
  { value: 'custom', label: 'Other' },
];

export default function DashboardSettings() {
  const [form, setForm] = useState({
    display_name: '', bio: '', avatar_url: '', banner_url: '',
    genre_tags: [], category: '',
    social_links: { instagram: '', twitter: '', spotify: '', website: '', tiktok: '', youtube: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState({ avatar: false, banner: false });

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  useEffect(() => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/settings?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm((prev) => ({
            ...prev,
            ...d.settings,
            social_links: {
              instagram: '', twitter: '', spotify: '', website: '', tiktok: '', youtube: '',
              ...(d.settings.social_links || {}),
            },
          }));
        }
      })
      .catch(console.error);
  }, []);

  const uploadImage = async (file, type) => {
    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      fd.append('email', getEmail());

      const res = await fetch('/api/creators/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        const field = type === 'avatar' ? 'avatar_url' : 'banner_url';
        setForm((prev) => ({ ...prev, [field]: data.url }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/creators/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getEmail(), ...form }),
      });
      if (res.ok) setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const updateSocial = (key) => (e) => setForm({
    ...form, social_links: { ...form.social_links, [key]: e.target.value }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Profile Settings</h1>

      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Display Name</label>
          <input type="text" value={form.display_name} onChange={update('display_name')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Bio</label>
          <textarea rows={4} value={form.bio || ''} onChange={update('bio')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none resize-none" />
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Category</label>
          <select value={form.category || ''} onChange={update('category')}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none">
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Avatar Image</label>
          {form.avatar_url && (
            <img src={form.avatar_url} alt="Avatar preview"
              className="w-20 h-20 rounded-full object-cover mb-2 border border-[#27272a]" />
          )}
          <input type="file" accept="image/*"
            onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'avatar'); }}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#D4AF37] file:text-black file:font-semibold file:cursor-pointer focus:border-[#D4AF37] focus:outline-none" />
          {uploading.avatar && <p className="text-sm text-[#D4AF37] mt-1">Uploading avatar...</p>}
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Banner Image</label>
          {form.banner_url && (
            <img src={form.banner_url} alt="Banner preview"
              className="w-full h-32 object-cover rounded-lg mb-2 border border-[#27272a]" />
          )}
          <input type="file" accept="image/*"
            onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0], 'banner'); }}
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#D4AF37] file:text-black file:font-semibold file:cursor-pointer focus:border-[#D4AF37] focus:outline-none" />
          {uploading.banner && <p className="text-sm text-[#D4AF37] mt-1">Uploading banner...</p>}
        </div>

        <div>
          <label className="block text-sm text-[#a1a1aa] mb-1">Genre Tags (comma-separated)</label>
          <input type="text"
            value={Array.isArray(form.genre_tags) ? form.genre_tags.join(', ') : ''}
            onChange={(e) => setForm({ ...form, genre_tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
            placeholder="Hip-Hop, R&B, Soul"
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-[#a1a1aa]">Social Links</label>
          {['instagram', 'twitter', 'tiktok', 'youtube', 'spotify', 'website'].map((key) => (
            <input key={key} type="url"
              value={form.social_links?.[key] || ''}
              onChange={updateSocial(key)}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1) + ' URL'}
              className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          ))}
        </div>

        <button type="submit" disabled={saving}
          className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
