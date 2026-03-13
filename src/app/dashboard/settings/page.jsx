'use client';

import { useState, useEffect } from 'react';

export default function DashboardSettings() {
  const [form, setForm] = useState({
    display_name: '', bio: '', avatar_url: '', banner_url: '',
    genre_tags: [], social_links: { instagram: '', twitter: '', spotify: '', website: '' },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  useEffect(() => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/settings?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => { if (d.settings) setForm((prev) => ({ ...prev, ...d.settings })); })
      .catch(console.error);
  }, []);

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
          <label className="block text-sm text-[#a1a1aa] mb-1">Avatar URL</label>
          <input type="url" value={form.avatar_url || ''} onChange={update('avatar_url')}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-[#18181b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
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
          {['instagram', 'twitter', 'spotify', 'website'].map((key) => (
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
