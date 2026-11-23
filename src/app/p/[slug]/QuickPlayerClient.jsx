"use client";

/**
 * MyStation — Quick Player client component (5 tracks).
 *
 * Mobile-first, fullscreen, dark navy + gold brand. Big album art for
 * the current track, playlist list below. Tapping a row jumps to that
 * track; the next one auto-plays when the current one ends.
 *
 * Uses a native <audio> element so it works on iOS Safari, Android
 * Chrome, desktop browsers, and in-app webviews (iMessage, IG, Twitter).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Share2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";

const GOLD = "#d4af37";
const NAVY = "#0b1220";
const CARD = "#121a2b";
const BORDER = "#1f2a44";
const MUTED = "#8a93a6";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function QuickPlayerClient({ playlist }) {
  const safePlaylist =
    Array.isArray(playlist) && playlist.length > 0 ? playlist : [];
  const audioRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const current = safePlaylist[idx] || null;

  // Keep local play state in sync with the <audio> element
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      // Auto-advance to the next track in the playlist
      if (idx < safePlaylist.length - 1) {
        setIdx(idx + 1);
      } else {
        setIsPlaying(false);
      }
    };
    const onTime = () => setProgress(a.currentTime || 0);
    const onMeta = () => setDuration(a.duration || 0);
    const onError = () => setError("Audio failed to load");
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("error", onError);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("error", onError);
    };
  }, [idx, safePlaylist.length]);

  // When idx changes, load the new track and try to continue playing
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    setError(null);
    setProgress(0);
    const wasPlaying = isPlaying;
    try {
      a.load();
      if (wasPlaying) {
        const p = a.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            // iOS blocks autoplay without a gesture — leave paused
            setIsPlaying(false);
          });
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, current?.audioFile]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch((e) =>
        setError(`Tap play again — browser needs a user gesture (${e.name})`),
      );
    } else {
      a.pause();
    }
  }, []);

  const next = useCallback(() => {
    if (idx < safePlaylist.length - 1) setIdx(idx + 1);
  }, [idx, safePlaylist.length]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    // If > 3s into track, restart it. Otherwise go to previous.
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    if (idx > 0) setIdx(idx - 1);
  }, [idx]);

  const seek = useCallback(
    (e) => {
      const a = audioRef.current;
      if (!a || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      a.currentTime = pct * duration;
    },
    [duration],
  );

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = current ? `${current.title} — ${current.artist}` : "MyStation";
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
    } catch (e) {
      // User dismissed or share failed — fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError("Couldn't copy link. Long-press the URL bar instead.");
    }
  }, [current]);

  if (!current) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: NAVY,
          color: "#e5e5e5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: GOLD,
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Nothing to play yet
          </div>
          <Link href="/music" style={{ color: GOLD }}>
            Open the full catalog on MyStation
          </Link>
        </div>
      </main>
    );
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 30% 20%, #121a2b 0%, ${NAVY} 60%)`,
        color: "#e5e5e5",
        display: "flex",
        flexDirection: "column",
        padding: "24px 20px 32px",
        paddingTop: "max(24px, env(safe-area-inset-top))",
        paddingBottom: "max(32px, env(safe-area-inset-bottom))",
      }}
    >
      {/* Top chrome — MyStation wordmark + share */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Link
          href="/"
          style={{
            color: GOLD,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1.5,
          }}
        >
          MYSTATION
        </Link>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Share this player"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: "#e5e5e5",
            borderRadius: 20,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <Share2 size={14} />
          {copied ? "Copied" : "Share"}
        </button>
      </div>

      {/* Album art — big, centered */}
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          aspectRatio: "1 / 1",
          margin: "0 auto",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow:
            "0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.1)",
          background: CARD,
          position: "relative",
        }}
      >
        {current.albumArt ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={current.albumArt}
            alt={`${current.title} album art`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: MUTED,
              fontSize: 14,
            }}
          >
            No artwork
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <div
          style={{
            color: "#e5e5e5",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          {current.title}
        </div>
        <div
          style={{ color: GOLD, fontSize: 14, marginTop: 6, fontWeight: 600 }}
        >
          {current.artist}
        </div>
        {current.album && (
          <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
            {current.album}
            {current.year ? ` · ${current.year}` : ""}
            {` · Track ${idx + 1} of ${safePlaylist.length}`}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 20,
          maxWidth: 420,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <div
          onClick={seek}
          role="progressbar"
          aria-label="Song progress"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={progress || 0}
          style={{
            height: 6,
            background: BORDER,
            borderRadius: 999,
            overflow: "hidden",
            cursor: duration ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: GOLD,
              transition: "width 0.15s linear",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: MUTED,
            fontSize: 11,
            marginTop: 6,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <span>{formatTime(progress)}</span>
          <span>
            {duration ? formatTime(duration) : current.duration || "--:--"}
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          marginTop: 16,
        }}
      >
        <button
          type="button"
          onClick={prev}
          aria-label="Previous track"
          disabled={idx === 0}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: idx === 0 ? "#3a4258" : "#e5e5e5",
            cursor: idx === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SkipBack size={20} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: GOLD,
            color: NAVY,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 30px rgba(212,175,55,0.35)",
          }}
        >
          {isPlaying ? (
            <Pause size={28} fill="currentColor" />
          ) : (
            <Play size={28} fill="currentColor" style={{ marginLeft: 3 }} />
          )}
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next track"
          disabled={idx >= safePlaylist.length - 1}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: idx >= safePlaylist.length - 1 ? "#3a4258" : "#e5e5e5",
            cursor: idx >= safePlaylist.length - 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SkipForward size={20} />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            color: "#fecaca",
            background: "#3a0f14",
            border: "1px solid #ef4444",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            textAlign: "center",
            maxWidth: 420,
            alignSelf: "center",
          }}
        >
          {error}
        </div>
      )}

      {/* Playlist — the 5 tracks */}
      <div
        style={{
          marginTop: 28,
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            color: MUTED,
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          UP NEXT · {safePlaylist.length} TRACKS
        </div>
        {safePlaylist.map((t, i) => {
          const active = i === idx;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setIdx(i);
                // Try to play; iOS blocks autoplay without a gesture — tap IS a gesture here.
                const a = audioRef.current;
                if (a) {
                  setTimeout(() => {
                    a.play().catch(() => {});
                  }, 50);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                width: "100%",
                background: active ? "rgba(212,175,55,0.08)" : "transparent",
                border: "none",
                borderBottom:
                  i < safePlaylist.length - 1 ? `1px solid ${BORDER}` : "none",
                color: "#e5e5e5",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 24,
                  color: active ? GOLD : MUTED,
                  fontWeight: active ? 800 : 600,
                  fontSize: 13,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {active ? (isPlaying ? "▶" : "·") : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: active ? GOLD : "#e5e5e5",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: MUTED,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.artist}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: MUTED,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {t.duration || "--:--"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mute pill (small, bottom) */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
        <button
          type="button"
          onClick={() => {
            const a = audioRef.current;
            if (!a) return;
            a.muted = !a.muted;
            setMuted(a.muted);
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: `1px solid ${BORDER}`,
            color: MUTED,
            borderRadius: 999,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
          }}
        >
          {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          {muted ? "Muted" : "Sound on"}
        </button>
      </div>

      {/* Spacer so CTA sits toward the bottom on tall screens */}
      <div style={{ flex: 1, minHeight: 20 }} />

      {/* Soft CTA — full catalog */}
      <div
        style={{
          marginTop: 24,
          textAlign: "center",
          padding: "16px 20px",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          maxWidth: 420,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <div style={{ color: "#e5e5e5", fontSize: 14, marginBottom: 10 }}>
          Want the whole catalog?
        </div>
        <Link
          href="/music"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: GOLD,
            color: NAVY,
            fontWeight: 800,
            borderRadius: 999,
            textDecoration: "none",
            fontSize: 14,
            letterSpacing: 0.3,
          }}
        >
          Open MyStation
        </Link>
      </div>

      <div
        style={{
          color: MUTED,
          fontSize: 11,
          textAlign: "center",
          marginTop: 16,
          letterSpacing: 1,
        }}
      >
        MYSTATION · IDMG
      </div>

      {/* The audio element — never rendered as visible UI */}
      <audio
        ref={audioRef}
        src={current.audioFile}
        preload="metadata"
        playsInline
        style={{ display: "none" }}
      />
    </main>
  );
}
