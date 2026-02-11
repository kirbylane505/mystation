export const metadata = {
  title: 'Dreamer Rewards — Spend. Earn. Experience.',
  description: 'Every dollar on MyStation counts. Hit $500 for Dreamer status with VIP perks. Hit $2,500 for a free weekend at the IDMG Compound — room, food, and lifetime friendships.',
  openGraph: {
    title: 'Dreamer Rewards — Spend. Earn. Experience.',
    description: 'Spend $2,500 on MyStation and earn a free weekend at the IDMG Compound. Room & food on us. Experience the lifestyle.',
    url: 'https://mystationlive.com/rewards',
    siteName: 'MyStation',
    images: [{ url: 'https://mystationlive.com/api/og?title=DREAMER%20REWARDS&artist=Spend.%20Earn.%20Experience.&album=IDMG%20Compound%20Weekend&year=MyStation', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dreamer Rewards — IDMG Compound Weekend',
    description: 'Spend $2,500 on MyStation and earn a free weekend at the IDMG Compound.',
    images: ['https://mystationlive.com/api/og?title=DREAMER%20REWARDS&artist=Spend.%20Earn.%20Experience.&album=IDMG%20Compound%20Weekend&year=MyStation'],
  },
};

export default function RewardsLayout({ children }) {
  return children;
}
