/**
 * MYSTATION - Root Layout
 * Premium music streaming for Mike Page Foundation
 */

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import AudioPlayer from '@/components/AudioPlayer';
import ClientProviders from '@/components/ClientProviders';

export const metadata = {
  metadataBase: new URL('https://mystation.vercel.app'),
  title: {
    default: 'MyStation - Mike Page Foundation',
    template: '%s | MyStation',
  },
  description: 'Stream Mike Page music for free. All donations support youth music programs through the Mike Page Foundation.',
  keywords: 'Mike Page, IDMG, hip-hop, music streaming, donation, foundation',

  // Open Graph - Shows when sharing on social media/iMessage
  openGraph: {
    title: 'FAVORITE PERSON - Mike Page | MyStation',
    description: 'Stream "Favorite Person" by Mike Page FREE on MyStation. Prod. The Cubist (SHOW_IDMG).',
    url: 'https://mystation.vercel.app',
    siteName: 'MyStation',
    images: [
      {
        url: '/images/og-favorite-person.png',
        width: 1200,
        height: 630,
        alt: 'Favorite Person - Mike Page - Stream on MyStation',
      },
    ],
    locale: 'en_US',
    type: 'music.song',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'FAVORITE PERSON - Mike Page',
    description: 'Stream FREE on MyStation. Prod. The Cubist.',
    images: ['/images/og-favorite-person.png'],
  },

  // Apple/iMessage specific
  other: {
    'apple-mobile-web-app-title': 'MyStation',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mystation-darker">
        <ClientProviders>
          <Navbar />
          <main className="pt-20 md:pt-24 pb-28">
            {children}
          </main>
          <Player />
          <AudioPlayer />
        </ClientProviders>
      </body>
    </html>
  );
}
// Cache bust Sun Feb  1 01:22:35 EST 2026
