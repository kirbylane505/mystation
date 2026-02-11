'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { makeAHitTracks, makeAHitInfo } from '@/data/make-a-hit';
import { usePlayerStore } from '@/store/playerStore';

export default function MakeAHitPage() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressInterval = useRef(null);
  const { isPlaying: globalPlaying, pause: globalPause } = usePlayerStore();

  // Only show tracks with an open verse
  const availableTracks = makeAHitTracks.filter(t => t.verseOpen);

  // When global player starts, stop Make A Hit audio
  useEffect(() => {
    if (globalPlaying && playing) {
      audioRef.current?.pause();
      setPlaying(null);
      stopProgressTracking();
    }
  }, [globalPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopProgressTracking();
  }, []);

  const stopProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressInterval.current = setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
          setDuration(audioRef.current.duration);
        }
      }
    }, 250);
  };

  const playTrack = (track) => {
    if (playing === track.id) {
      audioRef.current?.pause();
      setPlaying(null);
      stopProgressTracking();
    } else {
      // Pause global player first — no overlapping
      if (usePlayerStore.getState().isPlaying) {
        globalPause();
      }
      if (audioRef.current) {
        audioRef.current.src = track.audioFile;
        audioRef.current.play();
        setPlaying(track.id);
        setCurrentTime(0);
        setDuration(0);
        startProgressTracking();
      }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = pct * duration;
    setCurrentTime(audioRef.current.currentTime);
  };

  const skip = (seconds) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(
      audioRef.current.duration || 0,
      audioRef.current.currentTime + seconds
    ));
    setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleInquire = (track) => {
    const subject = encodeURIComponent(`MAKE A HIT - ${track.title}`);
    const body = encodeURIComponent(`I want to feature on "${track.title}"\n\nArtist Name:\nInstagram:\nSpotify/Apple Music Link:\n\nTell us about yourself:`);
    window.location.href = `mailto:${makeAHitInfo.contact.email}?subject=${subject}&body=${body}`;
  };

  const handleEnded = () => {
    setPlaying(null);
    setCurrentTime(0);
    stopProgressTracking();
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <audio ref={audioRef} onEnded={handleEnded} />

      {/* Hero */}
      <div className="bg-gradient-to-b from-red-900/50 to-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4">{makeAHitInfo.title}</h1>
          <p className="text-2xl text-red-400 mb-2">{makeAHitInfo.subtitle}</p>
          <p className="text-gray-400 text-lg">{makeAHitInfo.description}</p>
        </div>
      </div>

      {/* Available Tracks — only open verse tracks */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Available Tracks</h2>
        {availableTracks.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No tracks available right now. Check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTracks.map((track) => (
              <div
                key={track.id}
                className={`bg-zinc-900 rounded-xl p-6 border-2 transition-all cursor-pointer ${
                  selectedTrack?.id === track.id ? 'border-red-500' : 'border-zinc-800 hover:border-zinc-600'
                }`}
                onClick={() => setSelectedTrack(track)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{track.title}</h3>
                    <p className="text-gray-500 text-sm">Prod. {track.producer}</p>
                  </div>
                  <span className="text-2xl font-black text-green-500">${track.price}</span>
                </div>

                <div className="flex gap-2 text-xs text-gray-400 mb-4">
                  <span className="bg-zinc-800 px-2 py-1 rounded">{track.bpm} BPM</span>
                  <span className="bg-zinc-800 px-2 py-1 rounded">{track.key}</span>
                  <span className="bg-zinc-800 px-2 py-1 rounded">Verse {track.openVerse} Open</span>
                </div>

                <p className="text-gray-400 text-sm mb-4">{track.description}</p>

                {/* Player Controls */}
                {playing === track.id && (
                  <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                    {/* Seek bar */}
                    <div
                      className="w-full h-2 bg-zinc-700 rounded-full cursor-pointer group relative mb-2"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-red-500 rounded-full relative"
                        style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                    {/* Time + skip buttons */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatTime(currentTime)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => skip(-10)}
                          className="hover:text-white transition text-sm font-bold"
                          title="Rewind 10s"
                        >
                          -10s
                        </button>
                        <button
                          onClick={() => skip(10)}
                          className="hover:text-white transition text-sm font-bold"
                          title="Forward 10s"
                        >
                          +10s
                        </button>
                      </div>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); playTrack(track); }}
                    className={`flex-1 py-2 rounded-lg font-bold transition ${
                      playing === track.id
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {playing === track.id ? 'PAUSE' : 'PLAY'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleInquire(track); }}
                    className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg font-bold transition"
                  >
                    INQUIRE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-zinc-900/50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
          <div className="space-y-8">
            {makeAHitInfo.howItWorks.map((step) => (
              <div key={step.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-xl font-black shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">What You Get</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {makeAHitInfo.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 bg-zinc-900 p-4 rounded-lg">
              <span className="text-green-500 text-xl">✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-zinc-900/50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Requirements</h2>
          <ul className="space-y-3 max-w-2xl mx-auto">
            {makeAHitInfo.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <span className="text-yellow-500">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-4 text-center">
        <h2 className="text-4xl font-black mb-4">Ready to Make a Hit?</h2>
        <p className="text-gray-400 mb-8">Email us at {makeAHitInfo.contact.email}</p>
        <a
          href={`mailto:${makeAHitInfo.contact.email}?subject=MAKE A HIT - Inquiry`}
          className="inline-block bg-red-600 hover:bg-red-700 px-12 py-4 rounded-full text-xl font-bold transition"
        >
          GET STARTED
        </a>
      </div>
    </div>
  );
}
