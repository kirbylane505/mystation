/**
 * MYSTATION - Page View Tracker
 * Fires analytics event on each route change
 */

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();
  const lastPath = useRef(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Fire and forget — never block rendering
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        page_path: pathname,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
