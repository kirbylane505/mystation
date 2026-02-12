'use client';

import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FanZoneError({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={32} className="text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Fan Zone Hit a Snag</h2>
        <p className="text-white/50 text-sm mb-6">Something went wrong loading this section.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => reset()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition text-sm">
            <RefreshCw size={14} /> Retry
          </button>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition text-sm">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
