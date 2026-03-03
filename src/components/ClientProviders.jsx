/**
 * MYSTATION - Client-side Providers
 */

'use client';

import { Suspense, useEffect } from 'react';
import PostHogProvider from './PostHogProvider';
import { initNative } from '@/lib/native';

export default function ClientProviders({ children }) {
  useEffect(() => {
    initNative();
  }, []);

  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </PostHogProvider>
  );
}
