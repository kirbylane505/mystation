/**
 * MYSTATION - Referral Detector
 * Detects ?ref= param, stores referral, auto-applies 15% discount, shows banner
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { Gift, X } from 'lucide-react';
import Link from 'next/link';

export default function ReferralDetector() {
  const searchParams = useSearchParams();
  const [showBanner, setShowBanner] = useState(false);
  const [referrer, setReferrer] = useState(null);
  const setReferralCode = useCartStore((s) => s.setReferralCode);

  useEffect(() => {
    // Check URL for ?ref= param
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store in localStorage so it persists across pages
      localStorage.setItem('mystation_referred_by', refCode);
      localStorage.setItem('mystation_referral_discount', 'REFER15');
      setReferralCode('REFER15');
      setReferrer(refCode);
      setShowBanner(true);

      // Track referral count for the referrer (stored locally)
      const referrals = JSON.parse(localStorage.getItem('mystation_referral_visits') || '[]');
      if (!referrals.includes(refCode)) {
        referrals.push(refCode);
        localStorage.setItem('mystation_referral_visits', JSON.stringify(referrals));
      }
      return;
    }

    // Check localStorage for existing referral (persists across sessions)
    const existingRef = localStorage.getItem('mystation_referred_by');
    const existingDiscount = localStorage.getItem('mystation_referral_discount');
    if (existingRef && existingDiscount) {
      setReferralCode(existingDiscount);
      setReferrer(existingRef);
      // Show banner briefly on first load
      if (!sessionStorage.getItem('mystation_ref_banner_dismissed')) {
        setShowBanner(true);
      }
    }
  }, [searchParams, setReferralCode]);

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('mystation_ref_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="relative z-40 px-4 py-2 mb-2 animate-slide-up">
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl backdrop-blur-xl">
        <Gift size={20} className="text-green-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-green-400 font-bold text-sm">15% OFF Merch — Referral Reward!</p>
          <p className="text-white/50 text-xs">Auto-applied at checkout. Code: REFER15</p>
        </div>
        <Link
          href="/merch"
          onClick={dismiss}
          className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition shrink-0"
        >
          Shop
        </Link>
        <button onClick={dismiss} className="text-white/40 hover:text-white transition shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
