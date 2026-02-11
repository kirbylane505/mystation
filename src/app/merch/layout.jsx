export const metadata = {
  title: 'Official Merch — IDMG x Mike Page Foundation',
  description: 'Shop official IDMG & Mike Page merch. Hoodies, tees, snapbacks, joggers & more. Every purchase supports youth music programs through the Mike Page Foundation.',
  openGraph: {
    title: 'IDMG Official Merch — Hoodies, Tees, Snapbacks & More',
    description: 'Rep the movement. Official IDMG & Mike Page merch — hoodies, tees, snapbacks, joggers. Every purchase supports youth music programs.',
    url: 'https://mystationlive.com/merch',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'IDMG Official Merch — MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IDMG Official Merch — Rep The Movement',
    description: 'Hoodies, tees, snapbacks & more. Every purchase supports youth music programs.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
