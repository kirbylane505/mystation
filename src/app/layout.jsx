/**
 * MYSTATION - Root Layout
 * Premium music streaming by IDMG
 */

import { Montserrat, Inter } from 'next/font/google';
import '@/styles/globals.css';

// Critical components — eagerly loaded (needed for initial render)
import Navbar from '@/components/Navbar';
import Player from '@/components/Player';
import AudioPlayer from '@/components/AudioPlayer';
import SubscribeModal from '@/components/SubscribeModal';
import ClientProviders from '@/components/ClientProviders';
import Cart from '@/components/Cart';
import SessionGuard from '@/components/SessionGuard';
import AccountWall from '@/components/AccountWall';
import { Suspense } from 'react';
import ReferralDetector from '@/components/ReferralDetector';
import EmpireWelcome from '@/components/EmpireWelcome';
import Script from 'next/script';
import { Toaster } from 'sonner';
import FoundingMemberBanner from '@/components/FoundingMemberBanner';
import CashAppThankYou from '@/components/CashAppThankYou';

// Lazy-loaded utilities — code-split into separate chunks (loaded async after hydration)
import LazyUtilities from '@/components/LazyUtilities';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-montserrat',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  metadataBase: new URL('https://mystationlive.com'),
  title: {
    default: 'MyStation - IDMG',
    template: '%s | MyStation',
  },
  description: 'Stream Mike Page music for free. All proceeds support youth music programs through IDMG.',
  keywords: 'Mike Page, IDMG, hip-hop, music streaming, donation, foundation',

  // Open Graph - Shows when sharing on social media/iMessage
  openGraph: {
    title: 'MyStation - Stream Mike Page Music Free',
    description: 'Stream Mike Page music for free. Official merch, Love on the Lawn Festival tickets, and more. All donations support youth music programs.',
    url: 'https://mystationlive.com',
    siteName: 'MyStation',
    images: [
      {
        url: 'https://mystationlive.com/images/og-default.png',
        width: 1200,
        height: 630,
        alt: 'MyStation - Stream Mike Page Music Free',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'MyStation - Stream Mike Page Music Free',
    description: 'Stream Mike Page music for free. Official merch & Love on the Lawn Festival tickets.',
    images: ['https://mystationlive.com/images/og-default.png'],
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
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#6366f1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "MyStation",
              "alternateName": "IDMG - Impossible Dreamz Music Group",
              "url": "https://mystationlive.com",
              "logo": "https://mystationlive.com/images/idmg-logo-white.png",
              "sameAs": [
                "https://instagram.com/idmgatl",
                "https://tiktok.com/@idmgatl"
              ],
              "description": "Stream music, shop merch, support youth — MyStation by Mike Page Foundation",
              "foundingDate": "2026",
              "founder": {
                "@type": "Person",
                "name": "Mike Page"
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-mystation-darker">
        <ClientProviders>
          <AccountWall />
          <Navbar />
          <main className="pt-20 md:pt-24 pb-36">
            <FoundingMemberBanner />
            <Suspense><ReferralDetector /></Suspense>
            {children}
          </main>
          <Player />
          <AudioPlayer />
          <SubscribeModal />
          <Cart />
          <SessionGuard />
          <Suspense><EmpireWelcome /></Suspense>
          <CashAppThankYou />
          <LazyUtilities />
        </ClientProviders>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
                  .then(function(reg) {
                    // Force check for new SW on every page load
                    reg.update();
                    // When new SW is waiting, tell it to activate immediately
                    if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
                    reg.addEventListener('updatefound', function() {
                      var nw = reg.installing;
                      if (nw) nw.addEventListener('statechange', function() {
                        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                          nw.postMessage('SKIP_WAITING');
                        }
                      });
                    });
                  })
                  .catch(function() {});
              });
              // Reload when new SW takes over
              var refreshing = false;
              navigator.serviceWorker.addEventListener('controllerchange', function() {
                if (!refreshing) { refreshing = true; window.location.reload(); }
              });
            }
          `}
        </Script>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0a1628',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f8fafc',
            },
          }}
        />
      </body>
    </html>
  );
}
// Cache bust Sun Feb  1 01:22:35 EST 2026
