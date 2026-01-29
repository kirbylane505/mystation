/**
 * MYSTATION - Navigation Bar
 * Simple, luxury navigation
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import DonationButton from './DonationButton';
import { Menu, X, Search, User } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black text-white font-display">
              MY<span className="text-mystation-gold">STATION</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white/80 hover:text-white transition">
              Home
            </Link>
            <Link href="/music" className="text-white/80 hover:text-white transition">
              Music
            </Link>
            <Link href="/live" className="text-white/80 hover:text-white transition">
              Live
            </Link>
            <Link href="/about" className="text-white/80 hover:text-white transition">
              Foundation
            </Link>
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-white/60 hover:text-white transition">
              <Search size={20} />
            </button>
            <DonationButton />
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition">
              <User size={18} />
              <span className="text-sm">Sign In</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-white/10">
          <div className="px-6 py-4 space-y-4">
            <Link href="/" className="block text-white py-2">Home</Link>
            <Link href="/music" className="block text-white py-2">Music</Link>
            <Link href="/live" className="block text-white py-2">Live</Link>
            <Link href="/about" className="block text-white py-2">Foundation</Link>
            <div className="pt-4 border-t border-white/10">
              <DonationButton variant="hero" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
