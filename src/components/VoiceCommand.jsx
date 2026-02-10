'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { tracks } from '@/data/tracks';

// Navigation routes — voice command triggers → page path
const NAV_ROUTES = [
  { patterns: ['merch', 'store', 'shop', 'merchandise', 'clothing', 'clothes', 'apparel'], path: '/merch', label: 'Merch Store' },
  { patterns: ['lotl', 'love on the lawn', 'lawn', 'festival', 'tickets', 'lotl tickets', 'concert'], path: '/lotl', label: 'Love on the Lawn' },
  { patterns: ['about', 'about us', 'about page', 'who are you', 'info'], path: '/about', label: 'About' },
  { patterns: ['home', 'home page', 'main', 'main page', 'go home'], path: '/', label: 'Home' },
  { patterns: ['music', 'songs', 'all songs', 'catalog', 'library', 'all music'], path: '/music', label: 'Music' },
  { patterns: ['vault', 'the vault', 'open vault', 'vault songs'], path: '/vault', label: 'Vault' },
  { patterns: ['account', 'my account', 'profile', 'my profile', 'settings'], path: '/account', label: 'Account' },
  { patterns: ['news', 'updates', 'blog', 'whats new', "what's new"], path: '/news', label: 'News' },
  { patterns: ['videos', 'video', 'watch', 'visuals'], path: '/videos', label: 'Videos' },
  { patterns: ['live', 'live stream', 'stream', 'go live'], path: '/live', label: 'Live' },
  { patterns: ['station', 'my station', 'create station', 'radio', 'create'], path: '/station', label: 'Station' },
  { patterns: ['contact', 'contact us', 'reach out', 'get in touch', 'email'], path: '/contact', label: 'Contact' },
  { patterns: ['subscribe', 'subscription', 'sign up', 'upgrade', 'premium'], path: '/subscribe', label: 'Subscribe' },
  { patterns: ['cubist', 'the cubist', 'tyrell', 'artist'], path: '/artists/the-cubist', label: 'The Cubist' },
  { patterns: ['fan zone', 'fan', 'fans', 'community'], path: '/fan-zone', label: 'Fan Zone' },
  { patterns: ['events', 'calendar', 'shows', 'upcoming'], path: '/lotl', label: 'Events' },
  { patterns: ['checkout', 'cart', 'pay', 'payment'], path: '/checkout', label: 'Checkout' },
  { patterns: ['make a hit', 'beat maker', 'make music', 'create music'], path: '/make-a-hit', label: 'Make a Hit' },
];

// Normalize text for matching — handles speech-to-text quirks
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Smart fuzzy match — handles speech-to-text variations
function fuzzyMatch(query, title) {
  const q = normalize(query);
  const t = normalize(title);
  if (t === q) return 1.0;
  if (t.includes(q)) return 0.95;
  if (q.includes(t)) return 0.85;

  // Word-by-word matching (handles "going up" vs "goin up")
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);

  let wordMatches = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      // Exact word match
      if (tw === qw) { wordMatches += 1; break; }
      // Starts-with match ("goin" matches "going", "doin" matches "doing")
      if (tw.startsWith(qw) || qw.startsWith(tw)) { wordMatches += 0.8; break; }
      // Contains match
      if (tw.includes(qw) || qw.includes(tw)) { wordMatches += 0.6; break; }
    }
  }

  const score = wordMatches / Math.max(qWords.length, tWords.length);
  return score;
}

function findBestTrack(query) {
  let bestScore = 0;
  let bestTrack = null;
  for (const track of tracks) {
    // Match against title
    let score = fuzzyMatch(query, track.title);
    // Also try title + featured artist
    if (track.featured) {
      const combo = `${track.title} ${track.featured}`;
      score = Math.max(score, fuzzyMatch(query, combo));
    }
    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }
  return bestScore >= 0.3 ? bestTrack : null;
}

// Match a navigation command — returns { path, label } or null
function matchNavigation(cmd) {
  // Strip common prefixes: "go to", "open", "pull up", "take me to", "show me", "navigate to"
  const stripped = cmd
    .replace(/^(go\s+to|open|pull\s+up|take\s+me\s+to|show\s*me|navigate\s+to|bring\s+up|load|visit|check\s+out|show)\s+/i, '')
    .replace(/\s+page$/i, '')
    .trim();

  for (const route of NAV_ROUTES) {
    for (const pattern of route.patterns) {
      if (stripped === pattern || cmd === pattern) {
        return route;
      }
      // Fuzzy: check if the stripped command contains the pattern
      if (stripped.includes(pattern) || pattern.includes(stripped)) {
        return route;
      }
    }
  }
  return null;
}

// Strip wake word "MyStation" / "my station" / "hey mystation" from start
function stripWakeWord(text) {
  return text
    .replace(/^(hey\s+)?(my\s*station)\s*/i, '')
    .trim();
}

// Detect iOS Safari (SpeechRecognition is not available)
function isIOSSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua);
  return isIOS && isSafari;
}

export default function VoiceCommand() {
  const router = useRouter();
  const [supported, setSupported] = useState(false);
  const [unsupportedBrowser, setUnsupportedBrowser] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const recognitionRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const {
    isPlaying,
    volume,
    play,
    pause,
    setTrack,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    } else {
      // SpeechRecognition not available — check if iOS Safari
      if (isIOSSafari()) {
        setUnsupportedBrowser(true);
      }
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const showConfirmation = useCallback((msg, durationMs = 2500) => {
    setFeedback(msg);
    setShowFeedback(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setTranscript('');
    }, durationMs);
  }, []);

  const processCommand = useCallback((text) => {
    // Strip wake word: "MyStation play Goin Up" → "play Goin Up"
    const cmd = stripWakeWord(text).toLowerCase().trim();
    if (!cmd) { showConfirmation('Say a command...'); return; }

    // "play [song name]" — check before bare "play"
    const playMatch = cmd.match(/^(?:play|playing|put on|queue)\s+(.+)$/);
    if (playMatch) {
      const songQuery = playMatch[1];
      const matched = findBestTrack(songQuery);
      if (matched) {
        setTrack(matched);
        showConfirmation(`Playing "${matched.title}"`);
      } else {
        showConfirmation(`Can't find "${songQuery}"`);
      }
      return;
    }

    // resume / play (bare)
    if (/^(play|resume|go|start)$/.test(cmd)) {
      play();
      showConfirmation('Playing');
      return;
    }

    // pause / stop
    if (/^(pause|stop|hold|wait)$/.test(cmd)) {
      pause();
      showConfirmation('Paused');
      return;
    }

    // next / skip
    if (/^(next|next song|skip|skip this|next track)$/.test(cmd)) {
      nextTrack();
      showConfirmation('Next track');
      return;
    }

    // previous / go back
    if (/^(previous|go back|previous song|back|last song|rewind)$/.test(cmd)) {
      prevTrack();
      showConfirmation('Previous track');
      return;
    }

    // volume up / louder
    if (/^(volume\s*up|louder|turn\s*(it\s*)?up)$/.test(cmd)) {
      setVolume(Math.min(1, volume + 0.2));
      showConfirmation('Volume up');
      return;
    }

    // volume down / quieter
    if (/^(volume\s*down|quieter|softer|turn\s*(it\s*)?down)$/.test(cmd)) {
      setVolume(Math.max(0, volume - 0.2));
      showConfirmation('Volume down');
      return;
    }

    // mute / unmute
    if (/^(mute|unmute)$/.test(cmd)) {
      toggleMute();
      showConfirmation('Mute toggled');
      return;
    }

    // shuffle
    if (/^(shuffle|mix it up|random)$/.test(cmd)) {
      toggleShuffle();
      showConfirmation('Shuffle toggled');
      return;
    }

    // repeat
    if (/^(repeat|loop|replay)$/.test(cmd)) {
      toggleRepeat();
      showConfirmation('Repeat toggled');
      return;
    }

    // what's playing / what song is this
    if (/^(what.?s playing|what song|current song|what is this)$/.test(cmd)) {
      const track = usePlayerStore.getState().currentTrack;
      showConfirmation(track ? `"${track.title}" by Mike Page` : 'Nothing playing');
      return;
    }

    // --- NAVIGATION COMMANDS ---
    const navMatch = matchNavigation(cmd);
    if (navMatch) {
      showConfirmation(`Opening ${navMatch.label}...`);
      router.push(navMatch.path);
      return;
    }

    // If no command matched, try as a song search
    const matched = findBestTrack(cmd);
    if (matched) {
      setTrack(matched);
      showConfirmation(`Playing "${matched.title}"`);
      return;
    }

    showConfirmation(`Didn't catch that`);
  }, [play, pause, setTrack, nextTrack, prevTrack, setVolume, toggleMute, toggleShuffle, toggleRepeat, volume, showConfirmation, router]);

  const startListening = useCallback(async () => {
    // Unsupported browser (iOS Safari etc.) — show tooltip message
    if (unsupportedBrowser || !recognitionRef.current) {
      showConfirmation('Voice not supported on this browser', 3000);
      return;
    }

    const recognition = recognitionRef.current;
    if (listening) return;

    // --- Permission pre-check via Permissions API ---
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permStatus = await navigator.permissions.query({ name: 'microphone' });
        if (permStatus.state === 'denied') {
          setPermDenied(true);
          showConfirmation('Tap the lock icon \u{1F512} in your browser to allow mic', 4000);
          return;
        }
      }
    } catch {
      // Permissions API not supported for mic in this browser — fall through to getUserMedia
    }

    // Request microphone permission first — triggers browser prompt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Got permission — stop the stream immediately (SpeechRecognition manages its own)
      stream.getTracks().forEach(t => t.stop());
      setPermDenied(false);
    } catch (err) {
      setPermDenied(true);
      showConfirmation('Tap the lock icon \u{1F512} in your browser to allow mic', 4000);
      return;
    }

    setTranscript('');
    setFeedback('');
    setShowFeedback(false);
    retryCountRef.current = 0;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      if (final) {
        setTranscript(final);
      } else {
        setTranscript(interim);
      }
      if (final) {
        processCommand(final);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') {
        // Auto-retry once with a small delay if getUserMedia succeeded but recognition got blocked
        if (retryCountRef.current < 1) {
          retryCountRef.current += 1;
          setTimeout(() => {
            try {
              recognition.start();
            } catch {
              setListening(false);
              setPermDenied(true);
              showConfirmation('Tap the lock icon \u{1F512} in your browser to allow mic', 4000);
            }
          }, 500);
          return;
        }
        setListening(false);
        setPermDenied(true);
        showConfirmation('Tap the lock icon \u{1F512} in your browser to allow mic', 4000);
      } else if (e.error === 'no-speech') {
        setListening(false);
        showConfirmation('No speech detected \u2014 try again');
      } else if (e.error === 'network') {
        setListening(false);
        showConfirmation('Network error \u2014 check connection');
      } else {
        setListening(false);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
      setListening(true);
      retryCountRef.current = 0;
    } catch {
      // Auto-retry once on start failure
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        setTimeout(() => {
          try {
            recognition.start();
            setListening(true);
          } catch {
            showConfirmation('Could not start mic');
            setListening(false);
          }
        }, 500);
      } else {
        showConfirmation('Could not start mic');
        setListening(false);
      }
    }
  }, [listening, unsupportedBrowser, processCommand, showConfirmation]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition && listening) {
      try { recognition.stop(); } catch {}
      setListening(false);
    }
  }, [listening]);

  // Show button for unsupported browsers too (with click-to-show tooltip)
  if (!supported && !unsupportedBrowser) return null;

  return (
    <div className="relative flex items-center">
      {/* Feedback / Transcript Overlay */}
      {(listening || showFeedback || transcript) && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium shadow-xl border border-white/10 bg-mystation-navy/95 backdrop-blur-xl z-50">
          {showFeedback && feedback ? (
            <span className={permDenied ? 'text-amber-400' : 'text-blue-400'}>{feedback}</span>
          ) : transcript ? (
            <span className="text-white/70">{transcript}</span>
          ) : (
            <span className="text-red-400 animate-pulse">Listening...</span>
          )}
        </div>
      )}

      {/* Mic Button */}
      <button
        onClick={listening ? stopListening : startListening}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
          listening
            ? 'bg-red-500/25 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5),0_0_40px_rgba(239,68,68,0.25)]'
            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/40'
        }`}
        style={listening ? {
          animation: 'voicePulseGlow 1.5s ease-in-out infinite',
        } : undefined}
        title={unsupportedBrowser ? 'Voice not supported on this browser' : 'Voice Command'}
        aria-label={listening ? 'Stop listening' : unsupportedBrowser ? 'Voice not supported' : 'Voice command'}
      >
        {listening ? <Mic size={22} /> : <Mic size={20} />}

        {/* Pulsing Glow Rings — bigger, more visible */}
        {listening && (
          <>
            <span className="absolute -inset-1 rounded-full border-2 border-red-500 animate-ping opacity-30" />
            <span className="absolute -inset-0.5 rounded-full border-2 border-red-400 opacity-60" />
            <span className="absolute -inset-2 rounded-full border border-red-500/30 animate-pulse" />
          </>
        )}
      </button>

      {/* Keyframe for glow pulse — injected once */}
      <style jsx>{`
        @keyframes voicePulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.25);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4), 0 0 80px rgba(239, 68, 68, 0.15);
          }
        }
      `}</style>
    </div>
  );
}
