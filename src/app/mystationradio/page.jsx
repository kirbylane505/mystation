import { Suspense } from 'react';
import MyStationRadioClient from './MyStationRadioClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const station = params?.station || 'mike-page';
  const name = station.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const url = `https://mystationlive.com/mystationradio${station !== 'mike-page' ? `?station=${station}` : ''}`;
  const ogImage = `https://mystationlive.com/api/og/mystationradio?station=${encodeURIComponent(name)}`;
  return {
    metadataBase: new URL('https://mystationlive.com'),
    title: `${name} Radio · 24/7 on MyStation`,
    description: `${name} Radio — 24/7 nonstop mix. Every artist. Every track.`,
    openGraph: {
      title: `${name} Radio · 24/7 on MyStation`,
      description: `Nonstop mix on MyStation Radio. Smart-mixed. Always on.`,
      url,
      siteName: 'MyStation',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} Radio` }],
      // og:audio intentionally omitted to avoid iMessage duplicate play button
    },
    twitter: { card: 'summary_large_image', title: `${name} Radio`, images: [ogImage] },
  };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MyStationRadioClient />
    </Suspense>
  );
}
