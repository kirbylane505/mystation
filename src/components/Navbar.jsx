/**
 * MYSTATION - Floating Glass Navbar
 * Centered pill-shaped nav with glass blur & glow effects
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import { CartButton } from './Cart';
import { useUserStore, usePlayerStore } from '@/store/playerStore';
import {
  Home, Music, Flame, Heart, Users, ShoppingBag,
  Search, User, LogOut, X, Play, Menu, Lock, Mail, Calendar, Crown, Newspaper, Download, Gift, Zap, ListMusic, Gamepad2
} from 'lucide-react';
import { useEngagementStore } from '@/store/engagementStore';
import { useStationStore } from '@/store/stationStore';
import { tracks } from '@/data/tracks';

export default function Navbar() {
  const pathname = usePathname();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const searchRef = useRef(null);
  const { user, isLoggedIn, logout, isSubscribed } = useUserStore();
  const { currentStreak } = useEngagementStore();
  const { setQueue, openSubscribeModal } = usePlayerStore();
  const { isCreator, stationData } = useStationStore();

  // Nav items with icons
  // Mobile order: LOTL first, then Merch, Fan Zone, Foundation, then the rest
  const navItems = [
    { href: '/lotl', icon: Home, label: 'LOTL Tickets', mobileOrder: 0 },
    { href: '/music', icon: Music, label: 'Music', mobileOrder: 5 },
    { href: '/lotl', icon: Calendar, label: 'LOTL', mobileOrder: 1, hidden: true },
    { href: '/merch', icon: ShoppingBag, label: 'Merch', mobileOrder: 2 },
    { href: '/fan-zone', icon: Zap, label: 'Fan Zone', mobileOrder: 3 },
    { href: '/about', icon: Heart, label: 'Foundation', mobileOrder: 4 },
    { href: '/lounge', icon: Gamepad2, label: 'Lounge', highlight: true, mobileOrder: 6 },
    { href: '/make-a-hit', icon: Flame, label: 'Make A Hit', highlight: true, mobileOrder: 7 },
    { href: '/rewards', icon: Gift, label: 'Rewards', hidden: true, mobileOrder: 99 },
    { href: '/news', icon: Newspaper, label: 'News', mobileOrder: 8 },
    { href: '/search', icon: Search, label: 'Search', highlight: true, mobileOrder: 9 },
    { href: '/playlists', icon: ListMusic, label: 'Playlists', mobileOrder: 10 },
    { href: '/contact', icon: Mail, label: 'Contact', mobileOrder: 11 },
    { href: '/vault', icon: Lock, label: 'Vault', hidden: true, mobileOrder: 99 },
  ];

  // Sorted for mobile menu
  const mobileNavItems = [...navItems].sort((a, b) => (a.mobileOrder || 99) - (b.mobileOrder || 99));

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
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Capture PWA install prompt
  useEffect(() => {
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
      alert('Tap the share button in your browser, then "Add to Home Screen"');
    }
    setMobileMenuOpen(false);
  };

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mystation_user');
    if (savedUser) {
      useUserStore.getState().setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('mystation_user');
    logout();
  };

  return (
    <>
      {/* Floating Glass Navbar - Desktop */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 hidden md:block">
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

          {/* Create Station / Dashboard Button */}
          {isCreator ? (
            <Link
              href="/station/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition text-white font-bold text-sm"
            >
              <Crown size={16} />
              My Station
            </Link>
          ) : (
            <Link
              href="/station/create"
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
                  <div className="p-4 text-center text-white/50 text-sm">No MyStation songs found — try global search</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <CartButton />

          {/* User */}
          {isLoggedIn ? (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-white/80">{user?.name?.split(' ')[0] || 'User'}</span>
              </div>
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
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition text-white font-medium text-sm"
            >
              <User size={16} />
              Sign Up
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-mystation-navy/90 backdrop-blur-xl border-b border-white/10">
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

          {/* Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            {mobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-mystation-navy/95 backdrop-blur-xl border-b border-white/10 p-4 space-y-2">
            {mobileNavItems.filter(item => !item.hidden).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon size={20} className="text-white/60" />
                    <span className="text-white">{item.label}</span>
                  </a>
                );
              }

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
                  {item.badge && (
                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Create Station / Dashboard Button - Mobile */}
            {isCreator ? (
              <Link
                href="/station/dashboard"
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold mb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Crown size={18} />
                My Station Dashboard
              </Link>
            ) : (
              <Link
                href="/station/create"
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white font-bold mb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Crown size={18} />
                Create Your Station
              </Link>
            )}

            {/* Add to Home Screen - Mobile */}
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold mb-2"
            >
              <Download size={18} />
              Add to Home Screen
            </button>

            {/* Subscribe Button - Mobile */}
            {!isSubscribed && (
              <button
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl text-white font-bold mb-4"
                onClick={() => { setMobileMenuOpen(false); usePlayerStore.getState().openSubscribeModal(); }}
              >
                <Crown size={18} />
                Subscribe — Plans from $4.99/mo
              </button>
            )}

            <div className="pt-4 border-t border-white/10">
              {isLoggedIn ? (
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
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); setMobileMenuOpen(false); }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-bold"
                >
                  Sign Up Free
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}
