/**
 * MYSTATION - Client-side Providers
 */

'use client';

import { Suspense } from 'react';
import PostHogProvider from './PostHogProvider';

export default function ClientProviders({ children }) {
  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </PostHogProvider>
  );
}
