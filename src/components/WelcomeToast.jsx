'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Music } from 'lucide-react';

export default function WelcomeToast() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('mystation_welcomed')) return;

    const timer = setTimeout(() => {
      toast('Welcome to MyStation', {
        description: '100+ tracks. Preview 2 free — subscribe to unlock all.',
        icon: <Music size={16} className="text-blue-400" />,
        duration: 5000,
      });
      localStorage.setItem('mystation_welcomed', '1');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
