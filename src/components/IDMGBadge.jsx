'use client';

import Image from 'next/image';

export default function IDMGBadge() {
  return (
    <div className="fixed bottom-[90px] left-4 z-40 opacity-50 hover:opacity-90 transition-opacity duration-300 pointer-events-auto">
      <Image
        src="/images/idmg-logo-white.png"
        alt="IDMG"
        width={36}
        height={36}
        className="drop-shadow-lg"
        priority={false}
      />
    </div>
  );
}
