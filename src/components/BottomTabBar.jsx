"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Search,
  ShoppingBag,
  Radio,
  User,
  Mic,
} from "lucide-react";
import { useUserStore } from "@/store/playerStore";

export default function BottomTabBar() {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);
  const [creatorSlug, setCreatorSlug] = useState(null);

  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    fetch(`/api/creators/me?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.creator?.slug) setCreatorSlug(d.creator.slug);
      })
      .catch(() => {});
  }, [user?.email]);

  const tabs = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/music", icon: Music, label: "Music" },
    { href: "/mystationradio", icon: Radio, label: "Radio" },
    { href: "/search", icon: Search, label: "Search" },
    {
      href: creatorSlug ? `/artist/${creatorSlug}` : "/merch",
      icon: creatorSlug ? User : ShoppingBag,
      label: creatorSlug ? "My Profile" : "Shop",
    },
    { href: "/podstation", icon: Mic, label: "Live" },
  ];

  return (
    <nav
      aria-label="Bottom tab navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/[0.06] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                active ? "text-blue-400" : "text-white/40 active:text-white/60"
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
