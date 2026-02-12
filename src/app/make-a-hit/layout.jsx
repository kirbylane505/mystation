export const metadata = {
  title: 'Make A Hit',
  description: 'Preview exclusive beats by The Cubist. Pick your favorite, lay your verse, and make the next hit with IDMG.',
  openGraph: {
    title: 'Make A Hit — Pick A Beat, Make A Classic',
    description: 'Preview exclusive beats by The Cubist. Pick your favorite, lay your verse, and make the next hit with IDMG on MyStation.',
    url: 'https://mystationlive.com/make-a-hit',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Make A Hit — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Make A Hit — Pick A Beat, Make A Classic',
    description: 'Preview exclusive beats by The Cubist. Make the next hit with IDMG.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
