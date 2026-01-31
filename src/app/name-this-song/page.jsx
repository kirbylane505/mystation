/**
 * MYSTATION - Help Name This Song
 * Fan engagement feature with publishing credit opportunity
 */

'use client';

import { useState } from 'react';
import {
  Play, Pause, Music, Send, Gift, Star,
  Award, CheckCircle, Info, Sparkles, Heart
} from 'lucide-react';
import { untitledTracks, publishingInfo } from '@/data/untitled-tracks';
import { usePlayerStore } from '@/store/playerStore';

export default function NameThisSongPage() {
  const [submissions, setSubmissions] = useState({});
  const [submitted, setSubmitted] = useState({});

  // Use global player store - ensures only ONE song plays at a time
  const { currentTrack, isPlaying, setTrack, pause, play } = usePlayerStore();

  const playTrack = (track) => {
    // Check if this track is currently playing
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      // Set track in global player - this automatically stops any other playing track
      setTrack({
        ...track,
        title: track.workingTitle,
        album: 'Untitled'
      });
    }
  };

  const handleSubmit = (trackId) => {
    const suggestion = submissions[trackId];
    if (!suggestion?.name || !suggestion?.email) return;

    // In production, this would send to an API
    console.log('Submission:', { trackId, ...suggestion });

    setSubmitted(prev => ({ ...prev, [trackId]: true }));

    // Open email with submission
    const track = untitledTracks.find(t => t.id === trackId);
    const subject = encodeURIComponent(`Song Title Suggestion: ${track.workingTitle}`);
    const body = encodeURIComponent(
      `Song Title Suggestion for MyStation\n\n` +
      `Working Title: ${track.workingTitle}\n` +
      `Suggested Name: ${suggestion.name}\n` +
      `Submitted By: ${suggestion.email}\n\n` +
      `Reason: ${suggestion.reason || 'Not provided'}\n\n` +
      `---\nSent from MyStation - Mike Page Foundation`
    );
    window.open(`mailto:idmgatl@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  const updateSubmission = (trackId, field, value) => {
    setSubmissions(prev => ({
      ...prev,
      [trackId]: { ...prev[trackId], [field]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-mystation-darker">
      {/* Audio handled by global AudioPlayer - only ONE song plays at a time */}

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-6">
            <Gift size={16} className="text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">Earn Publishing Credit</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Help Me <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Name This Song</span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            These tracks need titles. Listen, get inspired, and submit your best name.
            <span className="text-purple-400 font-semibold"> If I use your title, you get publishing credit.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Music size={18} className="text-blue-400" />
              <span className="text-white/80">{untitledTracks.length} Untitled Tracks</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
              <Award size={18} className="text-yellow-400" />
              <span className="text-white/80">Real Publishing Credits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing Info */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <div className="glass rounded-3xl p-8 border border-purple-500/20">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Star size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">What You Get</h3>
              <p className="text-white/60">{publishingInfo.offer}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-purple-400 mb-3">Benefits</h4>
              <ul className="space-y-2">
                {publishingInfo.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">Rules</h4>
              <ul className="space-y-2">
                {publishingInfo.rules.map((rule, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/60 text-sm">
                    <Info size={14} className="text-white/40 flex-shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Untitled Tracks Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Sparkles className="text-purple-400" />
          Tracks Waiting For Names
        </h2>

        <div className="grid gap-6">
          {untitledTracks.map((track) => (
            <div
              key={track.id}
              className="glass rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Track Info */}
                <div className="flex items-start gap-4 lg:w-1/3">
                  <button
                    onClick={() => playTrack(track)}
                    className={`w-16 h-16 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                      currentTrack?.id === track.id && isPlaying
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={28} className="text-white" />
                    ) : (
                      <Play size={28} className="text-white ml-1" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-purple-400 font-medium mb-1">Working Title</p>
                    <h3 className="text-lg font-bold text-white truncate">{track.workingTitle}</h3>
                    {track.featured && (
                      <p className="text-sm text-white/50">ft. {track.featured}</p>
                    )}
                    <p className="text-sm text-white/40 mt-2">{track.description}</p>
                    <p className="text-xs text-white/30 mt-1">{track.year}</p>
                  </div>
                </div>

                {/* Submission Form */}
                <div className="lg:flex-1">
                  {submitted[track.id] ? (
                    <div className="h-full flex items-center justify-center bg-green-500/10 rounded-xl border border-green-500/20 p-6">
                      <div className="text-center">
                        <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                        <p className="text-green-400 font-semibold">Suggestion Submitted!</p>
                        <p className="text-white/50 text-sm mt-1">We'll contact you if selected</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Your suggested title..."
                          value={submissions[track.id]?.name || ''}
                          onChange={(e) => updateSubmission(track.id, 'name', e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                        />
                        <input
                          type="email"
                          placeholder="Your email..."
                          value={submissions[track.id]?.email || ''}
                          onChange={(e) => updateSubmission(track.id, 'email', e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Why this name? (optional)"
                          value={submissions[track.id]?.reason || ''}
                          onChange={(e) => updateSubmission(track.id, 'reason', e.target.value)}
                          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                        />
                        <button
                          onClick={() => handleSubmit(track.id)}
                          disabled={!submissions[track.id]?.name || !submissions[track.id]?.email}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send size={18} />
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <div className="glass rounded-3xl p-10 border border-purple-500/20">
          <Heart size={48} className="text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Support the Foundation</h3>
          <p className="text-white/60 mb-6">
            All donations support youth music programs through the Mike Page Foundation
          </p>
          <a
            href="https://cash.app/$RIDE4PAGEMUSIC847"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-green-500/30 transition"
          >
            Donate via Cash App
          </a>
          <p className="text-white/40 text-sm mt-4">$RIDE4PAGEMUSIC847</p>
        </div>
      </section>
    </div>
  );
}
