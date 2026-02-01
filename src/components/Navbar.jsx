/**
 * MYSTATION - Premium Navigation Bar
 * Navy blue theme with auth
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AuthModal from './AuthModal';
import { useUserStore, usePlayerStore } from '@/store/playerStore';
import { Menu, X, Search, User, Headphones, Gift, LogOut, Heart, Film, Flame, Trophy, Music, Play } from 'lucide-react';
import { useEngagementStore } from '@/store/engagementStore';
import { tracks } from '@/data/tracks';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const { user, isLoggedIn, logout } = useUserStore();
  const { currentStreak, earnedBadges } = useEngagementStore();
  const { setQueue } = usePlayerStore();

  // Filter tracks based on search
  const searchResults = searchQuery.length > 1
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
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

  const openSignUp = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const openSignIn = () => {
    setAuthMode('signin');
    setShowAuthModal(true);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-mystation-navy/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                <Headphones size={22} className="text-white" />
              </div>
              <span className="text-2xl font-black text-white font-display tracking-tight">
                MY<span className="gradient-text">STATION</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-white/70 hover:text-white transition font-medium">
                Home
              </Link>
              <Link href="/music" className="text-white/70 hover:text-white transition font-medium">
                Music
              </Link>
              <Link href="/videos" className="flex items-center gap-2 text-white/70 hover:text-white transition font-medium">
                <Film size={16} />
                Videos
              </Link>
              <Link href="/name-this-song" className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/30 transition font-medium border border-purple-500/30">
                <Gift size={14} />
                Name This Song
              </Link>
              <Link href="/live" className="text-white/70 hover:text-white transition font-medium">
                Live
              </Link>
              <Link href="/fan-zone" className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-300 rounded-full hover:from-orange-500/30 hover:to-pink-500/30 transition font-medium border border-orange-500/30">
                <Flame size={14} className="text-orange-400" />
                Fan Zone
                {currentStreak > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 rounded-full font-bold">{currentStreak}</span>
                )}
              </Link>
              <Link href="/about" className="text-white/70 hover:text-white transition font-medium">
                Foundation
              </Link>
              <Link href="/artists" className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30 transition font-medium border border-green-500/30">
                For Artists
              </Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search */}
              <div className="relative" ref={searchRef}>
                {searchOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search songs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-64 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/40 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-white/60 hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
                  >
                    <Search size={18} />
                  </button>
                )}

                {/* Search Results Dropdown */}
                {searchOpen && searchResults.length > 0 && (
                  <div className="absolute top-12 right-0 w-80 bg-mystation-navy/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
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
                          <p className="text-white font-medium text-sm truncate">{track.title}</p>
                          <p className="text-white/50 text-xs truncate">{track.album}</p>
                        </div>
                        <Play size={16} className="text-white/40" />
                      </button>
                    ))}
                  </div>
                )}

                {searchOpen && searchQuery.length > 1 && searchResults.length === 0 && (
                  <div className="absolute top-12 right-0 w-80 bg-mystation-navy/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-50">
                    <p className="text-white/50 text-sm text-center">No songs found</p>
                  </div>
                )}
              </div>

              {isLoggedIn ? (
                /* Logged In State */
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white/80">{user?.name?.split(' ')[0] || 'User'}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                /* Logged Out State */
                <div className="flex items-center gap-2">
                  <button
                    onClick={openSignIn}
                    className="px-4 py-2 text-white/70 hover:text-white transition text-sm font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignUp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full hover:shadow-lg hover:shadow-blue-500/30 transition text-white font-medium text-sm"
                  >
                    <User size={16} />
                    Sign Up Free
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-mystation-navy/95 backdrop-blur-xl border-t border-white/5">
            <div className="px-6 py-6 space-y-4">
              <Link href="/" className="block text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <Link href="/music" className="block text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>Music</Link>
              <Link href="/videos" className="flex items-center gap-2 text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>
                <Film size={16} />
                Videos
              </Link>
              <Link href="/name-this-song" className="flex items-center gap-2 text-purple-300 py-3 font-medium" onClick={() => setIsMenuOpen(false)}>
                <Gift size={16} />
                Name This Song
                <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded-full">Earn Publishing</span>
              </Link>
              <Link href="/live" className="block text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>Live</Link>
              <Link href="/fan-zone" className="flex items-center gap-2 text-orange-300 py-3 font-medium" onClick={() => setIsMenuOpen(false)}>
                <Flame size={16} className="text-orange-400" />
                Fan Zone
                {currentStreak > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{currentStreak} day streak</span>
                )}
              </Link>
              <Link href="/about" className="block text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>Foundation</Link>
              <Link href="/artists" className="flex items-center gap-2 text-green-300 py-3 font-medium" onClick={() => setIsMenuOpen(false)}>
                For Artists
                <span className="text-xs bg-green-500/30 px-2 py-0.5 rounded-full">$4.99/mo</span>
              </Link>

              <div className="pt-4 border-t border-white/10 space-y-3">
                {isLoggedIn ? (
                  <>
                    <div className="flex items-center gap-3 py-3">
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
                      className="w-full py-3 bg-white/5 text-red-400 rounded-xl font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { openSignUp(); setIsMenuOpen(false); }}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold"
                    >
                      Sign Up Free
                    </button>
                    <button
                      onClick={() => { openSignIn(); setIsMenuOpen(false); }}
                      className="w-full py-3 bg-white/5 text-white rounded-xl font-medium"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
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
