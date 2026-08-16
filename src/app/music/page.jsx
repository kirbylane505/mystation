/**
 * MYSTATION - Music Browse Page
 * Dynamic OG tags for link previews with album art
 */

import { tracks, albums } from "@/data/tracks";
import MusicPageClient from "./MusicPageClient";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Dynamic metadata for link previews
export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const trackId = params?.track;
  const albumId = params?.album;

  // Album-specific metadata (shareable album links)
  if (albumId) {
    const album = albums.find((a) => a.id === albumId);
    if (album) {
      const imageUrl =
        album.appleMusicArtwork ||
        album.coverImage ||
        "/images/albums/cindys-son.jpg";
      const fullImageUrl = imageUrl.startsWith("http")
        ? imageUrl
        : `https://mystationlive.com${imageUrl}`;
      return {
        title: `${album.title} - ${album.artist || "Mike Page"}`,
        description:
          album.description || `Stream "${album.title}" free on MyStation.`,
        openGraph: {
          title: `🎵 ${album.title} - ${album.artist || "Mike Page"}`,
          description: `${album.trackCount} tracks. Stream free on MyStation.\n${album.subtitle || ""}`,
          images: [
            { url: fullImageUrl, width: 1200, height: 1200, alt: album.title },
          ],
          type: "music.album",
          siteName: "MyStation",
        },
        twitter: {
          card: "summary_large_image",
          title: `🎵 ${album.title} - ${album.artist || "Mike Page"}`,
          description: `${album.trackCount} tracks. Stream free on MyStation.`,
          images: [fullImageUrl],
        },
      };
    }
  }

  if (trackId) {
    const track = tracks.find((t) => t.id === parseInt(trackId));
    if (track) {
      const album = albums.find((a) => a.id === track.albumId);
      const imageUrl = album?.coverImage || "/images/albums/cindys-son.jpg";
      const shareUrl = `https://mystationlive.com/music?track=${trackId}&autoplay=true&shared=true`;

      return {
        title: `${track.title} - Mike Page`,
        description: `Listen to "${track.title}" by Mike Page. Stream free on MyStation - all donations support the Mike Page Foundation.`,
        openGraph: {
          title: `🎵 ${track.title} - Mike Page`,
          description: `Tap to listen & drop a 🔥 if it's fire!\n\nStream free on MyStation`,
          url: shareUrl,
          images: [
            {
              url: `https://mystationlive.com${imageUrl}`,
              width: 1200,
              height: 630,
              alt: `${track.title} - Mike Page`,
            },
          ],
          type: "music.song",
          siteName: "MyStation",
          audio: track.audioFile
            ? [
                {
                  url: track.audioFile.startsWith("http")
                    ? track.audioFile
                    : `https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev/${track.audioFile.replace(/^\/audio\//, "")}`,
                  type: track.audioFile.endsWith(".m4a")
                    ? "audio/mp4"
                    : "audio/mpeg",
                },
              ]
            : undefined,
        },
        twitter: {
          card: "summary_large_image",
          title: `🎵 ${track.title} - Mike Page`,
          description: `Tap to listen & drop a 🔥 if it's fire!`,
          images: [`https://mystationlive.com${imageUrl}`],
        },
      };
    }
  }

  // Default metadata
  return {
    title: "Browse Music",
    description:
      "Stream Mike Page music for free. All donations support the Mike Page Foundation.",
    openGraph: {
      title: "MyStation - Mike Page Music",
      description: "Stream free. Support the Foundation.",
      images: [
        {
          url: "https://mystationlive.com/images/albums/cindys-son.jpg",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default async function MusicPage({ searchParams }) {
  const params = await searchParams;
  const trackId = params?.track;
  const albumId = params?.album;
  const autoplay = params?.autoplay === "true";
  const shared = params?.shared === "true";
  return (
    <MusicPageClient
      initialTrackId={trackId}
      initialAlbumId={albumId}
      autoplay={autoplay}
      shared={shared}
    />
  );
}
