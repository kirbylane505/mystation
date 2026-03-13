'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const email = document.cookie
      .split('; ')
      .find((c) => c.startsWith('mystation-email='))
      ?.split('=')[1];

    if (email) {
      fetch(`/api/creators/analytics?email=${encodeURIComponent(decodeURIComponent(email))}&summary=true`)
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
    }
  }, []);

  const cards = [
    { label: 'Total Plays', value: stats?.totalPlays ?? 0, color: 'text-blue-400' },
    { label: 'Tracks', value: stats?.trackCount ?? 0, color: 'text-purple-400' },
    { label: 'Followers', value: stats?.followerCount ?? 0, color: 'text-green-400' },
    { label: 'Merch Items', value: stats?.merchCount ?? 0, color: 'text-[#D4AF37]' },
  ];

  const actions = [
    { href: '/dashboard/upload', label: 'Upload Track', desc: 'Add music to your catalog', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { href: '/dashboard/merch', label: 'Create Merch', desc: 'Design and sell products', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { href: '/dashboard/settings', label: 'Edit Profile', desc: 'Update bio, avatar, links', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { href: '/dashboard/analytics', label: 'View Analytics', desc: 'Plays, fans, revenue', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
            <p className="text-sm text-[#71717a]">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>
              {typeof c.value === 'number' ? c.value.toLocaleString() : c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 p-4 rounded-lg bg-[#09090b] border border-[#27272a] hover:border-[#D4AF37] transition-colors">
              <svg className="w-6 h-6 text-[#D4AF37] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
              </svg>
              <div>
                <p className="text-white font-medium">{a.label}</p>
                <p className="text-xs text-[#71717a]">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
