/**
 * MYSTATION - Cash App Donation Button
 * Direct link to CashApp - NO MODAL
 */

'use client';

import { Heart } from 'lucide-react';

const CASHAPP_URL = 'https://cash.app/$RIDE4PAGEMUSIC847';

export default function DonationButton({ variant = 'default' }) {
  const handleDonate = () => {
    window.open(CASHAPP_URL, '_blank');
  };

  return variant === 'hero' ? (
    <button
      onClick={handleDonate}
      className="btn-secondary donation-highlight flex items-center gap-3"
    >
      <Heart size={18} />
      Support Foundation
    </button>
  ) : (
    <button
      onClick={handleDonate}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/10 text-blue-400 rounded-full hover:bg-blue-500/20 transition border border-blue-500/20"
    >
      <Heart size={16} />
      Donate
    </button>
  );
}
