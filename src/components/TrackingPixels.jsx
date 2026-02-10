/**
 * MYSTATION - Meta Pixel + Google Analytics
 * Add NEXT_PUBLIC_META_PIXEL_ID and NEXT_PUBLIC_GA_ID to Vercel env vars
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function TrackingPixels() {
  const pathname = usePathname();
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Track page views on route change
  useEffect(() => {
    // Meta Pixel page view
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
    // Google Analytics page view
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', { page_path: pathname });
    }
  }, [pathname]);

  return (
    <>
      {/* Meta Pixel */}
      {metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img height="1" width="1" style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Analytics */}
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}

// Helper to track custom events (call from anywhere)
export function trackEvent(eventName, params = {}) {
  // Meta Pixel
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
  // Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}
