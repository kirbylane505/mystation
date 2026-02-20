'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';

/**
 * /subscribe — Opens the subscribe modal and redirects to home
 * This ensures direct navigation to /subscribe works (no 404)
 */
export default function SubscribePage() {
  const router = useRouter();
  const { openSubscribeModal } = usePlayerStore();

  useEffect(() => {
    openSubscribeModal();
    router.replace('/');
  }, []);

  return null;
}
