export const metadata = {
  title: 'Kickback Lounge',
  description: 'Play classic games with friends in the IDMG MyStation Kickback Lounge. Spades, Dominos, 21, Poker, and more.',
  alternates: { canonical: 'https://mystationlive.com/lounge' },
  openGraph: {
    title: 'IDMG MyStation Kickback Lounge — Play Games With Friends',
    description: 'Multiplayer gaming lounge. Invite up to 8 friends for Spades, 21, Slides & Ladders, and more.',
    url: 'https://mystationlive.com/lounge',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyStation Kickback Lounge' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IDMG MyStation Kickback Lounge',
    description: 'Play classic games with friends. Real-time multiplayer.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
