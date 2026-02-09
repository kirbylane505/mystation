export const metadata = {
  title: 'Official Merch - Mike Page Foundation',
  description: 'Shop official Mike Page merch. Hoodies, tees, caps, and more. Every purchase supports youth music programs.',
  openGraph: {
    title: 'Mike Page Official Merch | MyStation',
    description: 'Shop official Mike Page merch. Hoodies, tees, caps & more. Every purchase supports youth music programs.',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mike Page Official Merch | MyStation',
    description: 'Shop official merch. Every purchase supports youth music programs.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
