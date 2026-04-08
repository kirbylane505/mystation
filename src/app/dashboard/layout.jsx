'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/playerStore';

const MUSIC_CATEGORIES = ['musician', 'producer', 'dj'];

const BASE_NAV = [
  { href: '/dashboard', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
];

const MUSIC_NAV = [
  { href: '/dashboard/upload', label: 'Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { href: '/dashboard/videos', label: 'Videos', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
];

const NON_MUSIC_NAV = [
  { href: '/dashboard/upload', label: 'Upload Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
];

const SHARED_NAV = [
  { href: '/dashboard/gallery', label: 'My Life', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/merch', label: 'Merch', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/dashboard/messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function NavIcon({ d }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useUserStore((s) => s.user);
  const userEmail = user?.email;

  useEffect(() => {
    if (!userEmail) {
      window.location.href = '/creators/signup';
      return;
    }

    fetch(`/api/creators/me?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.creator) {
          setCreator(data.creator);
        } else {
          window.location.href = '/creators/signup';
        }
      })
      .catch(() => {
        window.location.href = '/creators/signup';
      })
      .finally(() => setLoading(false));
  }, [userEmail]);

  const isMusic = creator && MUSIC_CATEGORIES.includes(creator.category);
  const navItems = [...BASE_NAV, ...(isMusic ? MUSIC_NAV : NON_MUSIC_NAV), ...SHARED_NAV];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar */}
      <nav className="w-64 bg-[#0a0a0c] border-r border-[#27272a] p-4 hidden lg:block">
        <div className="mb-8">
          <Link href="/" className="text-xs text-[#52525b] hover:text-[#D4AF37] transition-colors">
            &larr; Back to MyStation
          </Link>
          <h2 className="text-lg font-bold text-white mt-3">{creator?.display_name}</h2>
          <p className="text-xs text-[#71717a]">/{creator?.slug}</p>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'text-[#a1a1aa] hover:text-white hover:bg-[#18181b]'
              }`}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-[#27272a]">
          <Link
            href={`/artist/${creator?.slug}`}
            className="block text-xs text-[#71717a] hover:text-[#D4AF37] transition-colors"
          >
            View Public Profile &rarr;
          </Link>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0c] border-t border-[#27272a] flex lg:hidden z-50">
        {navItems.slice(0, 6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-xs ${
              pathname === item.href ? 'text-[#D4AF37]' : 'text-[#71717a]'
            }`}
          >
            <div className="flex justify-center mb-1"><NavIcon d={item.icon} /></div>
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 pb-20 lg:pb-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
