/**
 * MYSTATION — Shareable Quick Player
 *
 * /p/[slug] renders a 5-track mini-playlist starting from the hero track
 * named by the slug. Big album art for the current track, playlist list
 * below, Open MyStation CTA at the bottom.
 *
 * Server component — metadata is generated at build time so iMessage,
 * Slack, Twitter all render the rich preview card correctly.
 */

import { notFound } from "next/navigation";
import {
  findTrackBySlug,
  allTrackSlugs,
  trackDisplayArtist,
  trackAlbumArt,
  pickFiveStartingFrom,
  trackPayload,
  isPubliclyPlayable,
} from "@/lib/quickPlayerSlug";
import QuickPlayerClient from "./QuickPlayerClient";

const BASE = "https://mystationlive.com";

export async function generateStaticParams() {
  return allTrackSlugs();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const track = findTrackBySlug(slug);
  // Defense-in-depth: refuse to leak metadata for vault/unreleased tracks
  if (!track || !isPubliclyPlayable(track)) {
    return { title: "Track not found · MyStation" };
  }
  const artist = trackDisplayArtist(track);
  const albumArt = trackAlbumArt(track, { absolute: true });
  const title = `${track.title} — ${artist}`;
  const description = `Hear ${track.title} and 4 more tracks by ${artist} on MyStation.`;
  const url = `${BASE}/p/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "MyStation",
      type: "music.song",
      images: albumArt
        ? [{ url: albumArt, width: 1200, height: 1200, alt: title }]
        : undefined,
      musician: artist,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: albumArt ? [albumArt] : undefined,
    },
  };
}

export default async function QuickPlayerPage({ params }) {
  const { slug } = await params;
  const hero = findTrackBySlug(slug);
  // Defense-in-depth: double-check gate at the page body too
  if (!hero || !isPubliclyPlayable(hero)) notFound();

  const playlist = pickFiveStartingFrom(hero).map(trackPayload).filter(Boolean);

  return <QuickPlayerClient playlist={playlist} slug={slug} />;
}
