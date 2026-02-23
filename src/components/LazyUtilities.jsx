/**
 * MYSTATION - Lazy-loaded utility components
 * These are not needed for initial render — loaded async via next/dynamic
 */

'use client';

import dynamic from 'next/dynamic';

const TimedPopups = dynamic(() => import('@/components/TimedPopups'), { ssr: false });
const TrackingPixels = dynamic(() => import('@/components/TrackingPixels'), { ssr: false });
const ExtensionBridge = dynamic(() => import('@/components/ExtensionBridge'), { ssr: false });
const SharePage = dynamic(() => import('@/components/SharePage'), { ssr: false });
const IDMGBadge = dynamic(() => import('@/components/IDMGBadge'), { ssr: false });
const InstallPWA = dynamic(() => import('@/components/InstallPWA'), { ssr: false });
const WelcomeToast = dynamic(() => import('@/components/WelcomeToast'), { ssr: false });

export default function LazyUtilities() {
  return (
    <>
      <TimedPopups />
      <TrackingPixels />
      <ExtensionBridge />
      <SharePage />
      <IDMGBadge />
      <InstallPWA />
      <WelcomeToast />
    </>
  );
}
