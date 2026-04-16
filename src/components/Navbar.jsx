/**
 * MYSTATION - Floating Glass Navbar
 * Centered pill-shaped nav with glass blur & glow effects
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CartButton } from './Cart';
import { useCartStore } from '@/store/cartStore';
import { useUserStore, usePlayerStore } from '@/store/playerStore';
import {
  Home, Music, Heart, Users, ShoppingBag,
  Search, User, LogOut, X, Play, Menu, Mail, Crown, Newspaper, Ticket, Film, MoreHorizontal, HelpCircle, Download, Mic2, Radio, Disc3
} from 'lucide-react';
import { useEngagementStore } from '@/store/engagementStore';
import { tracks } from '@/data/tracks';

export default function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const searchRef = useRef(null);
  const moreRef = useRef(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const user = useUserStore(s => s.user);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const logout = useUserStore(s => s.logout);
  const isSubscribed = useUserStore(s => s.isSubscribed);
  const setQueue = usePlayerStore(s => s.setQueue);
  const [creatorSlug, setCreatorSlug] = useState(null);

  // Check if user is a creator (use store email — cookie is httpOnly)
  useEffect(() => {
    const email = user?.email;
    if (!email) return;
    fetch(`/api/creators/me?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { if (d.creator?.slug) setCreatorSlug(d.creator.slug); })
      .catch(() => {});
  }, [user?.email]);

  // Core nav items — 6 tabs
  const navItems = [
    { href: '/', icon: Home, label: 'Home', mobileOrder: 1 },
    { href: '/music', icon: Music, label: 'Music', mobileOrder: 2 },
    { href: '/mystationradio', icon: Disc3, label: 'Radio', mobileOrder: 3 },
    { href: '/merch', icon: ShoppingBag, label: 'Merch', mobileOrder: 4 },
    { href: '/events', icon: Ticket, label: 'Events', mobileOrder: 5 },
    { href: '/podstation', icon: Radio, label: 'PodStation', mobileOrder: 6 },
  ];

  // More menu items (shown in dropdown)
  const moreItems = [
    { href: '/account/profile', icon: User, label: 'Profile' },
    { href: '/videos', icon: Film, label: 'Videos' },
    { href: '/about', icon: Heart, label: 'Foundation' },
    { href: '/contact', icon: Mail, label: 'Contact' },
    { href: '/news', icon: Newspaper, label: 'News' },
    { href: '/creators', icon: Mic2, label: 'Creators' },
    { href: '/street-team', icon: Users, label: 'Street Team' },
    { href: '/faq', icon: HelpCircle, label: 'Help' },
  ];

  // Filter tracks based on search
  const searchResults = searchQuery.length > 1
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  // Play track from search
  const playFromSearch = (track) => {
    const idx = tracks.findIndex(t => t.id === track.id);
    setQueue(tracks, idx >= 0 ? idx : 0);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Close search on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Capture PWA install prompt + detect standalone
  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') setInstallPrompt(null);
    } else {
      // iOS fallback — show instructions
      toast.info('Tap the share button in your browser, then "Add to Home Screen"', { duration: 5000 });
    }
    setMobileMenuOpen(false);
  };

  // Restore user on mount — verify subscription from server (never forget subscribers)
  useEffect(() => {
    // First restore from localStorage for instant UI
    const savedUser = localStorage.getItem('mystation_user');
    if (savedUser) {
      try { useUserStore.getState().setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('mystation_user'); }
    }

    // Then verify against server DB (httpOnly cookies identify user)
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.user?.email) {
          const serverUser = {
            email: data.user.email,
            name: data.user.name,
            tier: data.user.tier,
            isSubscribed: data.user.isSubscribed,
          };
          // Always trust server — it checks the database
          useUserStore.getState().setUser(serverUser);
          localStorage.setItem('mystation_user', JSON.stringify(serverUser));
        }
      })
      .catch(() => {}); // Network error — keep localStorage state
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('mystation_user');
    logout();
  };

  return (
    <>
      {/* Floating Glass Navbar - Desktop */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] hidden lg:block">
        <div className="flex items-center gap-1 px-2 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 shadow-2xl shadow-black/20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-white">
              MY<span className="text-blue-400">STATION</span>
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-8 bg-white/20 mx-2" />

          {/* Nav Items */}
          {navItems.filter(item => !item.hidden).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-white/10 transition-all duration-300"
                >
                  <Icon size={20} className="text-white/60 group-hover:text-white transition" />
                  {/* Tooltip */}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                    {item.label}
                  </span>
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/40'
                    : 'hover:bg-white/10'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-white/60 group-hover:text-white transition'} />

                {/* Badge */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                moreMenuOpen ? 'bg-blue-500 shadow-lg shadow-blue-500/40' : 'hover:bg-white/10'
              }`}
            >
              <MoreHorizontal size={20} className={moreMenuOpen ? 'text-white' : 'text-white/60 group-hover:text-white transition'} />
              {/* Tooltip */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                More
              </span>
            </button>

            {moreMenuOpen && (
              <div className="absolute top-14 right-0 w-52 bg-mystation-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition ${
                        isActive ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-400' : 'text-white/60'} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                {!isStandalone && (
                  <>
                    <div className="h-px bg-white/10 mx-3 my-1" />
                    <button
                      onClick={handleInstall}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-500/20 text-indigo-300 transition"
                    >
                      <Download size={18} className="text-indigo-400" />
                      <span className="text-sm font-medium">Install App</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Create Station / My Profile Button */}
          {creatorSlug ? (
            <Link
              href={`/artist/${creatorSlug}`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition text-white font-bold text-sm"
            >
              <User size={16} />
              My Profile
            </Link>
          ) : (
            <Link
              href="/creators/signup"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition text-white font-bold text-sm"
            >
              <Crown size={16} />
              Create Station
            </Link>
          )}

          {/* Subscribe Button */}
          {!isSubscribed && (
            <button
              onClick={() => usePlayerStore.getState().openSubscribeModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full hover:shadow-lg hover:shadow-orange-500/30 transition text-white font-bold text-sm"
            >
              <Crown size={16} />
              Subscribe
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-8 bg-white/20 mx-2" />

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${
                searchOpen ? 'bg-blue-500' : 'hover:bg-white/10'
              }`}
            >
              {searchOpen ? <X size={20} className="text-white" /> : <Search size={20} className="text-white/60 hover:text-white" />}
            </button>

            {/* Search Dropdown */}
            {searchOpen && (
              <div className="absolute top-14 right-0 w-80 bg-mystation-navy/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Search songs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border-t border-white/10">
                    {searchResults.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => playFromSearch(track)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition text-left"
                      >
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <Music size={16} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm ">{track.title}</p>
                          <p className="text-white/50 text-xs ">{track.album}</p>
                        </div>
                        <Play size={16} className="text-white/40" />
                      </button>
                    ))}
                  </div>
                )}
                {/* Global search link */}
                {searchQuery.length > 1 && (
                  <div className="border-t border-white/10 p-2">
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium transition"
                    >
                      <Search size={14} />
                      Search all music for "{searchQuery}"
                    </Link>
                  </div>
                )}
                {searchQuery.length > 1 && searchResults.length === 0 && (
                  <div className="p-4 text-center text-white/50 text-sm">No MyStation songs found. Try global search.</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <CartButton />

          {/* User */}
          {(isLoggedIn || isSubscribed) ? (
            <div className="flex items-center gap-1">
              <Link
                href={creatorSlug ? `/artist/${creatorSlug}` : '/account'}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full hover:bg-white/10 transition"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-white/80">{user?.name?.split(' ')[0] || 'User'}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-red-500/20 transition"
                title="Sign Out"
              >
                <LogOut size={16} className="text-white/60 hover:text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => usePlayerStore.getState().setShowAccountWall(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition text-white font-medium text-sm"
            >
              <User size={16} />
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-[300] lg:hidden bg-mystation-navy/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-white">
              MY<span className="text-blue-400">STATION</span>
            </span>
          </Link>

          {/* Cart + Search + Sign In for mobile top bar */}
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Search size={18} className="text-white/60" />
            </Link>
            <button
              onClick={() => useCartStore.getState().openCart()}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center relative"
            >
              <ShoppingBag size={18} className="text-white/60" />
              {useCartStore.getState().getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                  {useCartStore.getState().getItemCount()}
                </span>
              )}
            </button>
            {/* Sign In / User Button — ALWAYS visible on mobile */}
            {(isLoggedIn || isSubscribed) ? (
              <Link
                href={creatorSlug ? `/artist/${creatorSlug}` : '/account'}
                className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center"
              >
                <span className="text-blue-400 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => usePlayerStore.getState().setShowAccountWall(true)}
                className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center"
              >
                <User size={18} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop + Dropdown — extracted for proper z-index */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[455]" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        </div>
      )}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-mystation-navy/98 backdrop-blur-xl border-t border-white/10 p-4 space-y-2 max-h-[60vh] overflow-y-auto z-[460]">
          {/* Core Nav Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className={isActive ? 'text-blue-400' : 'text-white/60'} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More Divider */}
          <div className="flex items-center gap-3 pt-2 pb-1 px-4">
            <MoreHorizontal size={16} className="text-white/30" />
            <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">More</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* More Items */}
          {moreItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className={isActive ? 'text-blue-400' : 'text-white/60'} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Install App - Mobile (only when not already installed) */}
          {!isStandalone && (
            <button
              onClick={() => { setMobileMenuOpen(false); handleInstall(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition mb-2"
            >
              <Download size={20} className="text-indigo-400" />
              <span className="text-indigo-300 font-medium">Install MyStation App</span>
            </button>
          )}

          {/* My Cart - Mobile */}
          <button
            onClick={() => { setMobileMenuOpen(false); useCartStore.getState().openCart(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition mb-2"
          >
            <ShoppingBag size={20} className="text-blue-400" />
            <span className="text-white font-medium">My Cart</span>
            {useCartStore.getState().getItemCount() > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                {useCartStore.getState().getItemCount()}
              </span>
            )}
          </button>

          {/* Create Station / My Profile Button - Mobile */}
          {creatorSlug ? (
            <Link
              href={`/artist/${creatorSlug}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold mb-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={16} />
              My Profile
            </Link>
          ) : (
            <Link
              href="/creators/signup"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-bold mb-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Crown size={16} />
              Create Your Station
            </Link>
          )}

          {/* Subscribe Button - Mobile */}
          {!isSubscribed && (
            <button
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold mb-4"
              onClick={() => { setMobileMenuOpen(false); usePlayerStore.getState().openSubscribeModal(); }}
            >
              <Crown size={18} />
              Subscribe for $4.99/mo
            </button>
          )}

          <div className="pt-4 border-t border-white/10">
            {(isLoggedIn || isSubscribed) ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.name || 'User'}</p>
                    <p className="text-white/50 text-sm">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); usePlayerStore.getState().setShowAccountWall(true); }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Bottom Tab Bar — persistent, Spotify-style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[450] bg-[#0a0f1a]/98 backdrop-blur-2xl border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-14 px-1">
          {[
            { href: '/', icon: Home, label: 'Home' },
            { href: '/music', icon: Music, label: 'Music' },
            { href: '/search', icon: Search, label: 'Search' },
            creatorSlug
              ? { href: `/artist/${creatorSlug}`, icon: User, label: 'My Profile' }
              : { href: '/merch', icon: ShoppingBag, label: 'Merch' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-16 h-full gap-0.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className={isActive ? 'text-blue-400' : 'text-white/40'} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-400' : 'text-white/40'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          {/* More tab — highlight when menu open OR on a non-tab page */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex flex-col items-center justify-center w-16 h-full gap-0.5"
          >
            <MoreHorizontal size={20} className={mobileMenuOpen || !['/', '/music', '/search', '/merch'].includes(pathname) && !(creatorSlug && pathname === `/artist/${creatorSlug}`) ? 'text-blue-400' : 'text-white/40'} />
            <span className={`text-[10px] font-medium ${mobileMenuOpen || !['/', '/music', '/search', '/merch'].includes(pathname) && !(creatorSlug && pathname === `/artist/${creatorSlug}`) ? 'text-blue-400' : 'text-white/40'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

    </>
  );
}
