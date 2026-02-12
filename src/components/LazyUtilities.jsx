/**
 * MYSTATION - Lazy-loaded utility components
 * These are not needed for initial render — loaded async via next/dynamic
 * Keeps the initial JS bundle small while still loading all features
 */

'use client';

import dynamic from 'next/dynamic';

const InstallPWA = dynamic(() => import('@/components/InstallPWA'), { ssr: false });
const PageTracker = dynamic(() => import('@/components/PageTracker'), { ssr: false });
const TimedPopups = dynamic(() => import('@/components/TimedPopups'), { ssr: false });
const EmailCapturePopup = dynamic(() => import('@/components/EmailCapturePopup'), { ssr: false });
const TrackingPixels = dynamic(() => import('@/components/TrackingPixels'), { ssr: false });
const ExtensionBridge = dynamic(() => import('@/components/ExtensionBridge'), { ssr: false });
const SharePage = dynamic(() => import('@/components/SharePage'), { ssr: false });
const IDMGBadge = dynamic(() => import('@/components/IDMGBadge'), { ssr: false });

export default function LazyUtilities() {
  return (
    <>
      <InstallPWA />
      <TimedPopups />
      <EmailCapturePopup />
      <TrackingPixels />
      <ExtensionBridge />
      <PageTracker />
      <SharePage />
      <IDMGBadge />
    </>
  );
}
