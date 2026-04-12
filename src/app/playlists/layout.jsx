export const metadata = {
  title: 'Playlists',
  description: 'Curated playlists from Mike Page and IDMG. Discover new music, classic tracks, and exclusive mixes on MyStation.',
  alternates: { canonical: 'https://mystationlive.com/playlists' },
  openGraph: {
    title: 'Playlists | Curated by Mike Page & IDMG',
    description: 'Curated playlists from Mike Page and IDMG. Discover new music, classic tracks, and exclusive mixes.',
    url: 'https://mystationlive.com/playlists',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyStation Playlists' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playlists | Curated by Mike Page & IDMG',
    description: 'Discover new music, classic tracks, and exclusive mixes.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
