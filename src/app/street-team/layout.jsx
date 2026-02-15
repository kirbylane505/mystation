export const metadata = {
  title: 'Street Team | MyStation',
  description: 'Join the IDMG Online Street Team. Share your link, earn rewards, climb the ranks from Recruit to General.',
  openGraph: {
    title: 'IDMG Street Team — Earn Rewards by Sharing',
    description: 'Join the IDMG Online Street Team. Share your link and earn rewards.',
    url: 'https://mystationlive.com/street-team',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'IDMG Street Team — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IDMG Street Team — Earn Rewards by Sharing',
    description: 'Join the IDMG Online Street Team and earn rewards.',
    images: ['/images/og-image.png'],
  },
};

export default function StreetTeamLayout({ children }) {
  return children;
}
