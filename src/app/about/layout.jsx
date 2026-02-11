export const metadata = {
  title: 'About — Mike Page Foundation',
  description: 'The Mike Page Foundation uses music to empower youth and build community. Learn about our mission, programs, and impact.',
  openGraph: {
    title: 'Mike Page Foundation — Music. Community. Impact.',
    description: 'Using music to empower youth and build community. Learn about our mission and the movement behind MyStation.',
    url: 'https://mystationlive.com/about',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Mike Page Foundation — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mike Page Foundation — Music. Community. Impact.',
    description: 'Using music to empower youth and build community.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
