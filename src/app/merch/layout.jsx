export const metadata = {
  title: 'Official Merch | IDMG x Mike Page Foundation',
  description: 'Shop official IDMG & Mike Page merch. Hoodies, tees, snapbacks, joggers & more. Every purchase supports youth music programs through the Mike Page Foundation (EIN: 41-3820708).',
  openGraph: {
    title: 'IDMG Official Merch | Hoodies, Tees, Snapbacks & More',
    description: 'Rep the movement. Official IDMG & Mike Page merch: hoodies, tees, snapbacks, joggers. Every purchase supports youth music programs.',
    url: 'https://mystationlive.com/merch',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'IDMG Official Merch on MyStation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IDMG Official Merch | Rep The Movement',
    description: 'Hoodies, tees, snapbacks & more. Every purchase supports youth music programs.',
    images: ['/images/og-image.png'],
  },
};

const merchJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "IDMG Official Merch",
  "description": "Shop official IDMG & Mike Page merch. Hoodies, tees, snapbacks, joggers & more. Every purchase supports youth music programs.",
  "url": "https://mystationlive.com/merch",
  "isPartOf": {
    "@type": "WebSite",
    "name": "MyStation",
    "url": "https://mystationlive.com",
  },
  "provider": {
    "@type": "Organization",
    "name": "IDMG - Impossible Dreamz Music Group",
    "url": "https://mystationlive.com",
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "15.99",
    "highPrice": "59.99",
    "offerCount": "50+",
    "availability": "https://schema.org/InStock",
  },
  "about": [
    { "@type": "Thing", "name": "Hoodies" },
    { "@type": "Thing", "name": "T-Shirts" },
    { "@type": "Thing", "name": "Snapbacks" },
    { "@type": "Thing", "name": "Activewear" },
    { "@type": "Thing", "name": "Kids Clothing" },
    { "@type": "Thing", "name": "Accessories" },
  ],
};

export default function Layout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(merchJsonLd) }}
      />
      {children}
    </>
  );
}
