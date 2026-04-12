export const metadata = {
  title: 'The Vault',
  description: 'Access The Vault. Exclusive unreleased Mike Page tracks, rare content, and behind-the-scenes material. PIN required.',
  openGraph: {
    title: 'THE VAULT | Exclusive Unreleased Music',
    description: 'Exclusive unreleased Mike Page tracks, rare content, and behind-the-scenes material. Only on MyStation.',
    url: 'https://mystationlive.com/vault',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'The Vault on MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE VAULT | Exclusive Unreleased Music',
    description: 'Unreleased tracks & rare content. Only on MyStation.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
