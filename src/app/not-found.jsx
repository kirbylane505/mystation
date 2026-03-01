/**
 * MYSTATION - Custom 404 Page
 * Branded dark-theme "page not found" with navigation links
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0e1a' }}>
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-black text-blue-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          This page doesn&apos;t exist. Let&apos;s get you back to the music.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Home
          </Link>
          <Link
            href="/music"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            Music
          </Link>
          <Link
            href="/merch"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            Merch
          </Link>
        </div>
      </div>
    </div>
  );
}
