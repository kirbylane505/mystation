export const metadata = {
  title: 'Videos',
  description: 'Watch official Mike Page music videos, behind-the-scenes footage, and exclusive content from IDMG.',
  alternates: { canonical: 'https://mystationlive.com/videos' },
  openGraph: {
    title: 'Mike Page Videos — Official Music Videos & Exclusives',
    description: 'Watch official music videos, behind-the-scenes footage, and exclusive content from IDMG on MyStation.',
    url: 'https://mystationlive.com/videos',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Mike Page Videos — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mike Page Videos — Official Music Videos & Exclusives',
    description: 'Watch official music videos and exclusive content from IDMG.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
