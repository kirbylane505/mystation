/**
 * MYSTATION - All Artists Index
 * Fixes Nov 21, 2026 404 on /artists. Shows every artist in the tracks
 * catalog as a card, with Mike Page + The Cubist featured.
 */

import Link from "next/link";
import { tracks } from "@/data/tracks";

export const metadata = {
  title: "Artists · MyStation",
  description:
    "Mike Page, The Cubist (Tyrell Thornton), and the IDMG catalog on MyStation. Stream the full roster.",
  alternates: { canonical: "https://mystationlive.com/artists" },
  openGraph: {
    title: "MyStation Artists — IDMG & Friends",
    description:
      "Mike Page, The Cubist, and the full IDMG roster. Stream every track.",
    url: "https://mystationlive.com/artists",
    siteName: "MyStation",
    type: "website",
  },
};

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function groupArtists() {
  // Collect every unique artist string + a representative track + count
  const map = new Map();
  for (const t of tracks) {
    const key = (t.artist || "").trim();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, { artist: key, trackCount: 0, firstTrack: t });
    }
    map.get(key).trackCount += 1;
  }
  return [...map.values()].sort((a, b) => b.trackCount - a.trackCount);
}

export default function AllArtistsPage() {
  const artists = groupArtists();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#e5e5e5",
        padding: "32px 16px 64px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Link
            href="/"
            style={{ color: "#d4af37", textDecoration: "none", fontSize: 14 }}
          >
            ← MyStation
          </Link>
        </div>

        <h1
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: -1,
            color: "#d4af37",
            margin: "0 0 8px",
          }}
        >
          Artists
        </h1>
        <p style={{ color: "#8a93a6", fontSize: 16, marginBottom: 40 }}>
          Mike Page, The Cubist, and the full IDMG catalog.
        </p>

        {/* Featured — Mike Page + The Cubist */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#8a93a6",
              marginBottom: 12,
            }}
          >
            FEATURED
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            <Link
              href="/artist/mike-page"
              style={{
                background: "#121a2b",
                border: "1px solid #1f2a44",
                borderRadius: 14,
                padding: 24,
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: "#d4af37",
                  marginBottom: 6,
                }}
              >
                IDMG FOUNDER
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                Mike Page
              </div>
              <div style={{ color: "#8a93a6", fontSize: 14 }}>
                Impossible Dreamz Music Group · Love on the Lawn
              </div>
            </Link>

            <Link
              href="/artists/the-cubist"
              style={{
                background: "#121a2b",
                border: "1px solid #1f2a44",
                borderRadius: 14,
                padding: 24,
                textDecoration: "none",
                color: "inherit",
                display: "block",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  color: "#d4af37",
                  marginBottom: 6,
                }}
              >
                PRODUCER · 100M+ STREAMS
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                The Cubist
              </div>
              <div style={{ color: "#8a93a6", fontSize: 14 }}>
                Tyrell Thornton · BET+ Season 2 · French Montana · Max B
              </div>
            </Link>
          </div>
        </section>

        {/* Full roster */}
        <section>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: "#8a93a6",
              marginBottom: 12,
            }}
          >
            FULL ROSTER
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {artists.map(({ artist, trackCount }) => (
              <Link
                key={artist}
                href={`/artist/${slugify(artist)}`}
                style={{
                  background: "#121a2b",
                  border: "1px solid #1f2a44",
                  borderRadius: 10,
                  padding: 16,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#e5e5e5",
                  }}
                >
                  {artist}
                </div>
                <div style={{ fontSize: 12, color: "#8a93a6" }}>
                  {trackCount} track{trackCount === 1 ? "" : "s"} in catalog
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid #1f2a44",
            color: "#8a93a6",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Want your music on MyStation?{" "}
          <Link href="/creators/signup" style={{ color: "#d4af37" }}>
            Apply as a creator
          </Link>
        </div>
      </div>
    </main>
  );
}
