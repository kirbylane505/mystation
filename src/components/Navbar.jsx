/**
 * MYSTATION - Premium Navigation Bar
 * Navy blue theme with auth
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DonationButton from './DonationButton';
import AuthModal from './AuthModal';
import { useUserStore } from '@/store/playerStore';
import { Menu, X, Search, User, Headphones, Gift, LogOut, Heart, Film } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const { user, isLoggedIn, logout } = useUserStore();

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
              <Link href="/about" className="text-white/70 hover:text-white transition font-medium">
                Foundation
              </Link>
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition">
                <Search size={18} />
              </button>
              <DonationButton />

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
              <Link href="/about" className="block text-white py-3 font-medium" onClick={() => setIsMenuOpen(false)}>Foundation</Link>

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
                <DonationButton variant="hero" />
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
