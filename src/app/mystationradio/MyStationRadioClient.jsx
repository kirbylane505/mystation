'use client';
import { useEffect, useState, useRef } from 'react';
import { Radio, Search, Power, ArrowLeft, WifiOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRadioStore } from '@/store/radioStore';
import { usePlayerStore } from '@/store/playerStore';
import RadioNowPlaying from '@/components/RadioNowPlaying';
import RadioStationTile from '@/components/RadioStationTile';

export default function MyStationRadioClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStation = searchParams.get('station');

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };
  const { startStation, activeStation, queue, cursor, isRadioActive } = useRadioStore();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [catalog, setCatalog] = useState([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [tunedIn, setTunedIn] = useState(false); // user has tapped the tuner (audio unlocked)
  const [isOnline, setIsOnline] = useState(true);
  const pendingStationRef = useRef(null); // station to start after first tap

  // Track online/offline state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load catalog
  useEffect(() => {
    fetch('/api/mystationradio/catalog')
      .then((r) => r.json())
      .then((d) => setCatalog(d.artists || []))
      .catch(() => {});
  }, []);

  // Pre-resolve which station to tune into (from URL or default Mike Page)
  useEffect(() => {
    if (catalog.length === 0) return;
    const slug = urlStation || 'mike-page';
    const station = catalog.find((s) => s.slug === slug) || catalog.find((s) => s.slug === 'mike-page');
    if (station) pendingStationRef.current = station;
  }, [catalog, urlStation]);

  // Attempt autoplay once catalog ready — will succeed if audio was already unlocked by a prior gesture
  useEffect(() => {
    if (tunedIn || isRadioActive) return;
    if (!pendingStationRef.current) return;
    // Fire and forget — if browser blocks, the TUNE IN overlay stays visible
    startStation(pendingStationRef.current);
  }, [catalog, tunedIn, isRadioActive, startStation]);

  // Once audio confirmed playing, hide the tuner overlay permanently for this session
  useEffect(() => {
    if (isRadioActive && isPlaying) setTunedIn(true);
  }, [isRadioActive, isPlaying]);

  // First-tap handler — explicitly unlocks iOS audio + starts the station in the gesture
  const handleTuneIn = () => {
    // Try to kick audio right now in the gesture window
    try {
      const el = typeof window !== 'undefined' ? window.__mystation_audio : null;
      if (el) { el.play().catch(() => {}); }
    } catch {}
    const s = pendingStationRef.current || catalog.find((c) => c.slug === 'mike-page');
    if (s) startStation(s);
    setTunedIn(true);
  };

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
  const showTuner = !tunedIn && !(isRadioActive && isPlaying);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f0a1c] to-[#0a0a0a] text-white pb-32">
      {/* FULL-SCREEN TUNE IN — appears until audio is confirmed playing */}
      {showTuner && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0a0a] via-[#1a0f05] to-[#0a0a0a] backdrop-blur-sm"
          onClick={handleTuneIn}
          role="button"
          tabIndex={0}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleBack(); }}
            className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">Back</span>
          </button>
          <div className="text-[#FFD700] text-xs font-bold tracking-[4px] uppercase mb-4">
            MyStation Radio
          </div>
          <div className="text-6xl md:text-8xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] bg-clip-text text-transparent">
              24/7
            </span>
          </div>
          <div className="text-xl md:text-2xl text-white/70 font-semibold mb-10 text-center px-6">
            {pendingStationRef.current?.name || 'Mike Page'} Radio
          </div>
          <button
            onClick={handleTuneIn}
            className="group relative flex flex-col items-center justify-center w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] shadow-[0_0_80px_rgba(255,215,0,0.6)] hover:shadow-[0_0_120px_rgba(255,215,0,0.9)] active:scale-95 transition-all"
          >
            <Power className="w-20 h-20 md:w-24 md:h-24 text-black mb-2 fill-black" strokeWidth={2.5} />
            <div className="text-black font-black text-2xl md:text-3xl tracking-wide">TUNE IN</div>
          </button>
          <div className="mt-8 text-white/40 text-sm text-center px-6">
            Tap once. Plays all day.
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 pt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all mb-4"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>
        <div className="flex items-center gap-2 text-[#FFD700] text-xs font-bold tracking-[3px] uppercase mb-3">
          <Radio className="w-4 h-4" /> MyStation Radio
          {!isOnline && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px]">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}
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
