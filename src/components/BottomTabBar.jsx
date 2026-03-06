'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Music, Search, ShoppingBag, MessageCircle } from 'lucide-react';

const tabs = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/music', icon: Music, label: 'Music' },
  { href: '/community', icon: MessageCircle, label: 'Community' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/merch', icon: ShoppingBag, label: 'Shop' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  // Hide during active game rooms (not lounge lobby)
  const isGameRoom = pathname?.startsWith('/lounge/') && pathname !== '/lounge';
  if (isGameRoom) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                active ? 'text-blue-400' : 'text-white/40 active:text-white/60'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
