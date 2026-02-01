/**
 * MYSTATION - Client-side Providers & Modals
 * Wraps app with global client components
 */

'use client';

import SubscribeModal from './SubscribeModal';

export default function ClientProviders({ children }) {
  return (
    <>
      {children}
      <SubscribeModal />
    </>
  );
}
