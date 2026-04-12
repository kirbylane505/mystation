export const metadata = {
  title: 'Search',
  description: 'Search for music, artists, and albums on MyStation. Stream Mike Page, The Cubist, and more from IDMG.',
  alternates: { canonical: 'https://mystationlive.com/search' },
  openGraph: {
    title: 'Search Music | MyStation',
    description: 'Search for music, artists, and albums. Stream Mike Page, The Cubist, and more from IDMG.',
    url: 'https://mystationlive.com/search',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Search MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Music | MyStation',
    description: 'Find and stream music from Mike Page, The Cubist, and IDMG.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
