export const metadata = {
  title: 'Create Your Station | MyStation',
  description: 'Build your own creator station on MyStation. Sell products, create playlists, connect with fans. Keep 100% of what you earn.',
  openGraph: {
    title: 'Create Your Station — MyStation',
    description: 'Build your own creator station. Keep 100% of what you earn.',
    url: 'https://mystationlive.com/station/create',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Create Your Station — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your Station — MyStation',
    description: 'Build your own creator station. Keep 100% of what you earn.',
    images: ['/images/og-image.png'],
  },
};

export default function CreateStationLayout({ children }) {
  return children;
}
