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
import PageTransition from '@/components/PageTransition';
import CashAppThankYou from '@/components/CashAppThankYou';
import SubscriberThankYou from '@/components/SubscriberThankYou';
import BottomTabBar from '@/components/BottomTabBar';

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL('https://mystationlive.com'),
  title: {
    default: 'MyStation — Stream Mike Page Music Free | IDMG',
    template: '%s | MyStation',
  },
  description: 'Stream Mike Page music for free. Official IDMG merch, Love on the Lawn Festival tickets, and exclusive content. All proceeds support youth music programs.',
  keywords: 'Mike Page, IDMG, hip-hop, R&B, music streaming, Love on the Lawn, LOTL, festival, merch, Mike Page Foundation, nonprofit, Elgin IL',

  // Canonical
  alternates: {
    canonical: 'https://mystationlive.com',
  },

  // Open Graph
  openGraph: {
    title: 'MyStation — Stream Mike Page Music Free',
    description: 'Stream Mike Page music for free. Official merch, Love on the Lawn Festival tickets, and more. All donations support youth music programs.',
    url: 'https://mystationlive.com',
    siteName: 'MyStation',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyStation — Stream Mike Page Music Free' }],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    site: '@idmgatl',
    creator: '@idmgatl',
    title: 'MyStation — Stream Mike Page Music Free',
    description: 'Stream Mike Page music for free. Official merch & Love on the Lawn Festival tickets.',
    images: ['/images/og-image.png'],
  },

  // Apple/iMessage specific
  other: {
    'apple-mobile-web-app-title': 'MyStation',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "MyStation",
              "alternateName": "IDMG - Impossible Dreamz Music Group",
              "url": "https://mystationlive.com",
              "logo": "https://mystationlive.com/images/mystation-logo.png",
              "sameAs": [
                "https://instagram.com/idmgatl",
                "https://tiktok.com/@idmgatl",
                "https://instagram.com/loveonthelawnfestival"
              ],
              "description": "Stream music, shop merch, support youth — MyStation by Mike Page Foundation",
              "foundingDate": "2026",
              "founder": {
                "@type": "Person",
                "name": "Mike Page"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "mystationlive@gmail.com",
                "contactType": "customer support"
              }
            })
          }}
        />
        {/* WebSite SearchAction — enables Google sitelinks search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "MyStation",
              "url": "https://mystationlive.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://mystationlive.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* MusicGroup Schema — Mike Page as artist */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MusicGroup",
              "name": "Mike Page",
              "url": "https://mystationlive.com",
              "genre": ["Hip-Hop", "R&B"],
              "description": "Mike Page — hip-hop/R&B artist, founder of IDMG and the Love on the Lawn Festival",
              "sameAs": [
                "https://instagram.com/idmgatl",
                "https://tiktok.com/@idmgatl"
              ],
              "member": {
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
          <main className="pt-20 md:pt-24 pb-48 md:pb-40">
            <FoundingMemberBanner />
            <Suspense><ReferralDetector /></Suspense>
            <PageTransition>{children}</PageTransition>
          </main>
          <Player />
          <BottomTabBar />
          <AudioPlayer />
          <SubscribeModal />
          <Cart />
          <SessionGuard />
          <Suspense><EmpireWelcome /></Suspense>
          <CashAppThankYou />
          <SubscriberThankYou />
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
