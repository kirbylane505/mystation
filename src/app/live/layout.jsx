export const metadata = {
  title: 'Go Live',
  description: 'Go live on MyStation. Stream, perform, and connect with fans in real-time.',
  openGraph: {
    title: 'Go Live on MyStation — Stream & Connect',
    description: 'Go live on MyStation. Stream, perform, and connect with fans in real-time.',
    url: 'https://mystationlive.com/live',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Go Live — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Go Live on MyStation',
    description: 'Stream, perform, and connect with fans in real-time.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
