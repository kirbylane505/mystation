export const metadata = {
  title: 'Contact',
  description: 'Get in touch with Mike Page, IDMG, and the MyStation team. Booking, partnerships, press inquiries, and general questions.',
  alternates: { canonical: 'https://mystationlive.com/contact' },
  openGraph: {
    title: 'Contact MyStation | IDMG',
    description: 'Get in touch with Mike Page, IDMG, and the MyStation team. Booking, partnerships, press, and general inquiries.',
    url: 'https://mystationlive.com/contact',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'Contact MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact MyStation | IDMG',
    description: 'Get in touch with Mike Page, IDMG, and the MyStation team.',
    images: ['/images/og-image.png'],
  },
};
export default function Layout({ children }) { return children; }
