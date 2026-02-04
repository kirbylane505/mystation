'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/station/create');
  }, [router]);

  return (
    <div className="min-h-screen bg-mystation-darker flex items-center justify-center">
      <p className="text-white/50">Redirecting to Create Station...</p>
    </div>
  );
}
