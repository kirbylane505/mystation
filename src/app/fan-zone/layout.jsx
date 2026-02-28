export const metadata = {
  title: 'Fan Zone',
  description: 'Join the MyStation Fan Zone. Connect with the community, earn loyalty points, and get exclusive access to Mike Page content.',
  alternates: { canonical: 'https://mystationlive.com/fan-zone' },
  openGraph: {
    title: 'MyStation Fan Zone — Join The Movement',
    description: 'Connect with the community, earn loyalty points, and get exclusive access to Mike Page content.',
    url: 'https://mystationlive.com/fan-zone',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyStation Fan Zone' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyStation Fan Zone — Join The Movement',
    description: 'Connect, earn points, and get exclusive access.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
