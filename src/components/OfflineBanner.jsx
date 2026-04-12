'use client';
import { WifiOff } from 'lucide-react';
import usePWA from '@/hooks/usePWA';

export default function OfflineBanner() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff size={14} />
      You&apos;re offline, playing cached music
    </div>
  );
}
