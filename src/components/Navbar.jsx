/**
 * MYSTATION - Premium Navigation Bar
 * Navy blue theme
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import DonationButton from './DonationButton';
import { Menu, X, Search, User, Headphones } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
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
          <div className="hidden md:flex items-center gap-10">
            <Link href="/" className="text-white/70 hover:text-white transition font-medium">
              Home
            </Link>
            <Link href="/music" className="text-white/70 hover:text-white transition font-medium">
              Music
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
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-full hover:bg-white/10 transition border border-white/10">
              <User size={16} />
              <span className="text-sm font-medium">Sign In</span>
            </button>
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
            <Link href="/" className="block text-white py-3 font-medium">Home</Link>
            <Link href="/music" className="block text-white py-3 font-medium">Music</Link>
            <Link href="/live" className="block text-white py-3 font-medium">Live</Link>
            <Link href="/about" className="block text-white py-3 font-medium">Foundation</Link>
            <div className="pt-4 border-t border-white/10">
              <DonationButton variant="hero" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
