'use client';
import { useEffect, useState } from 'react';
import { Radio, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRadioStore } from '@/store/radioStore';
import { usePlayerStore } from '@/store/playerStore';
import RadioNowPlaying from '@/components/RadioNowPlaying';
import RadioStationTile from '@/components/RadioStationTile';

export default function MyStationRadioClient() {
  const searchParams = useSearchParams();
  const urlStation = searchParams.get('station');
  const { startStation, activeStation, queue, cursor, isRadioActive } = useRadioStore();
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Load catalog
  useEffect(() => {
    fetch('/api/mystationradio/catalog')
      .then((r) => r.json())
      .then((d) => setCatalog(d.artists || []))
      .catch(() => {});
  }, []);

  // URL-based auto-play (shared links)
  useEffect(() => {
    if (bootstrapped) return;
    if (catalog.length === 0) return;
    const slug = urlStation || 'mike-page';
    const station = catalog.find((s) => s.slug === slug) || catalog.find((s) => s.slug === 'mike-page');
    if (station && !isRadioActive) {
      startStation(station);
    }
    setBootstrapped(true);
  }, [catalog, urlStation, isRadioActive, startStation, bootstrapped]);

  // Live search
  useEffect(() => {
    if (!q.trim()) return setResults([]);
    const ctl = new AbortController();
    fetch(`/api/mystationradio/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .catch(() => {});
    return () => ctl.abort();
  }, [q]);

  const upcoming = queue.slice(cursor + 1, cursor + 6);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0a1c] to-[#0a0a0a] text-white pb-32">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
          <Radio className="w-4 h-4" /> MyStation Radio
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
          <span className="bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] bg-clip-text text-transparent">
            24/7
          </span>
        </h1>
        <p className="text-xl text-white/70 mb-8">Every artist. Every track. Non-stop.</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artist..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD700]/40"
          />
          {results.length > 0 && (
            <div className="absolute top-full mt-2 left-0 right-0 bg-[#0f0a1c] border border-white/10 rounded-2xl overflow-hidden z-10 shadow-2xl">
              {results.map((r) => (
                <button
                  key={r.slug}
                  onClick={() => { startStation(r); setQ(''); setResults([]); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-white">{r.name}</div>
                    <div className="text-xs text-white/50">{r.trackCount} tracks</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Now Playing */}
        <div className="mb-8">
          <RadioNowPlaying />
        </div>

        {/* Featured Stations */}
        <div className="mb-8">
          <div className="text-xs font-bold tracking-[2px] uppercase text-white/50 mb-3">Featured Stations</div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {catalog.slice(0, 12).map((s) => (
              <RadioStationTile
                key={s.slug}
                station={s}
                active={activeStation?.slug === s.slug}
                onPlay={startStation}
              />
            ))}
          </div>
        </div>

        {/* Coming Up */}
        {upcoming.length > 0 && (
          <div>
            <div className="text-xs font-bold tracking-[2px] uppercase text-white/50 mb-3">Coming Up Next</div>
            <div className="space-y-2">
              {upcoming.map((t, i) => (
                <div key={`${t.id}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[#FFD700]/50 font-bold text-sm tabular-nums w-6">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold truncate">{t.title}</div>
                    <div className="text-xs text-white/50 truncate">{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
