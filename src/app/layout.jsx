/**
 * MYSTATION - Root Layout
 * Premium music streaming for Mike Page Foundation
 */

import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import AudioPlayer from '@/components/AudioPlayer';
import SubscribeModal from '@/components/SubscribeModal';
import ClientProviders from '@/components/ClientProviders';
import Cart from '@/components/Cart';
import InstallPWA from '@/components/InstallPWA';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://mystationlive.com'),
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
    url: 'https://mystationlive.com',
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
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },

  // PWA Manifest
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/images/mpf-logo.png" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className="min-h-screen bg-mystation-darker">
        <ClientProviders>
          <Navbar />
          <main className="pt-20 md:pt-24 pb-28">
            {children}
          </main>
          <Player />
          <AudioPlayer />
          <SubscribeModal />
          <Cart />
          <InstallPWA />
        </ClientProviders>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((reg) => console.log('SW registered:', reg.scope))
                  .catch((err) => console.log('SW failed:', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
// Cache bust Sun Feb  1 01:22:35 EST 2026
