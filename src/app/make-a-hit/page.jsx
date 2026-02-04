'use client';

import { useState, useRef } from 'react';
import { makeAHitTracks, makeAHitInfo } from '@/data/make-a-hit';

export default function MakeAHitPage() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playing, setPlaying] = useState(null);
  const audioRef = useRef(null);

  const playTrack = (track) => {
    if (playing === track.id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.audioFile;
        audioRef.current.play();
        setPlaying(track.id);
      }
    }
  };

  const handleInquire = (track) => {
    const subject = encodeURIComponent(`MAKE A HIT - ${track.title}`);
    const body = encodeURIComponent(`I want to feature on "${track.title}"\n\nArtist Name:\nInstagram:\nSpotify/Apple Music Link:\n\nTell us about yourself:`);
    window.location.href = `mailto:${makeAHitInfo.contact.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24">
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />

      {/* Hero */}
      <div className="bg-gradient-to-b from-red-900/50 to-black py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4">{makeAHitInfo.title}</h1>
          <p className="text-2xl text-red-400 mb-2">{makeAHitInfo.subtitle}</p>
          <p className="text-gray-400 text-lg">{makeAHitInfo.description}</p>
        </div>
      </div>

      {/* Available Tracks */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Available Tracks</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {makeAHitTracks.map((track) => (
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
