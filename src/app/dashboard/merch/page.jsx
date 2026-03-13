'use client';

import { useState, useEffect } from 'react';

export default function DashboardMerch() {
  const [merch, setMerch] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const getEmail = () => decodeURIComponent(
    document.cookie.split('; ').find((c) => c.startsWith('mystation-email='))?.split('=')[1] || ''
  );

  const loadMerch = () => {
    const email = getEmail();
    if (!email) return;
    fetch(`/api/creators/merch?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setMerch(d.merch || []))
      .catch(console.error);
  };

  useEffect(() => { loadMerch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/creators/merch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getEmail(), ...form, price: parseFloat(form.price) }),
      });

      if (res.ok) {
        setForm({ title: '', description: '', price: '', image_url: '' });
        setShowForm(false);
        loadMerch();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item?')) return;
    await fetch(`/api/creators/merch?email=${encodeURIComponent(getEmail())}&id=${id}`, { method: 'DELETE' });
    loadMerch();
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Merch</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] transition-all text-sm"
        >
          {showForm ? 'Cancel' : '+ Add Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 mb-6 max-w-lg space-y-3">
          <input type="text" required placeholder="Product Title" value={form.title} onChange={update('title')}
            className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          <textarea placeholder="Description (optional)" value={form.description} onChange={update('description')} rows={2}
            className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" required step="0.01" min="1" placeholder="Price ($)" value={form.price} onChange={update('price')}
              className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
            <input type="url" placeholder="Image URL" value={form.image_url} onChange={update('image_url')}
              className="w-full px-4 py-3 bg-[#09090b] border border-[#27272a] rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#b8962e] disabled:opacity-50 transition-all">
            {saving ? 'Creating...' : 'Create Item'}
          </button>
        </form>
      )}

      {merch.length === 0 ? (
        <div className="text-center text-[#71717a] py-12">
          <p className="text-lg mb-2">No merch yet</p>
          <p className="text-sm">Add your first product to start selling</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {merch.map((item) => (
            <div key={item.id} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h3 className="text-white font-bold">{item.title}</h3>
                <p className="text-[#D4AF37] font-bold mt-1">${Number(item.price).toFixed(2)}</p>
                {item.description && <p className="text-[#71717a] text-sm mt-1 line-clamp-2">{item.description}</p>}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
