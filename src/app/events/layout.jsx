export const metadata = {
  title: 'Events',
  description: 'Upcoming events from IDMG and Mike Page. Love on the Lawn Day 2026, September 5, Elgin IL. 10,000 capacity. Live music, food, community.',
  alternates: { canonical: 'https://mystationlive.com/events' },
  openGraph: {
    title: 'Events | Love on the Lawn Day 2026 & More',
    description: 'Upcoming events from IDMG. Love on the Lawn Day 2026, September 5, Elgin IL. 10,000 capacity. Live music, food, community.',
    url: 'https://mystationlive.com/events',
    siteName: 'MyStation',
    images: [{ url: '/images/og-image.png', width: 1200, height: 630, alt: 'MyStation Events' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events | Love on the Lawn Day 2026',
    description: 'September 5, 2026. Elgin, IL. 10,000 capacity. Get tickets now.',
    images: ['/images/og-image.png'],
  },
};

export default function EventsLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": "Love on the Lawn Day 2026",
            "description": "5th Annual Love on the Lawn Day, the biggest Hip-Hop/R&B festival in the Midwest. Live music, food, community. 10,000 capacity.",
            "startDate": "2026-09-05T12:00:00-05:00",
            "endDate": "2026-09-05T22:00:00-05:00",
            "eventStatus": "https://schema.org/EventScheduled",
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "location": {
              "@type": "Place",
              "name": "Festival Park",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "132 S. Grove Ave",
                "addressLocality": "Elgin",
                "addressRegion": "IL",
                "postalCode": "60120",
                "addressCountry": "US"
              }
            },
            "organizer": {
              "@type": "Organization",
              "name": "Love on the Lawn Festival LLC",
              "url": "https://lotlfest.com"
            },
            "performer": {
              "@type": "MusicGroup",
              "name": "Mike Page"
            },
            "offers": [
              {
                "@type": "Offer",
                "name": "Early Bird",
                "price": "20.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://myticketslive.com/events/lotl-2026",
                "validFrom": "2026-02-01"
              },
              {
                "@type": "Offer",
                "name": "Squad Pack (3 tickets)",
                "price": "50.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://myticketslive.com/events/lotl-2026"
              },
              {
                "@type": "Offer",
                "name": "Family Pack (5 tickets)",
                "price": "70.00",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "url": "https://myticketslive.com/events/lotl-2026"
              }
            ],
            "image": "https://mystationlive.com/images/lotl-logo-2026.png"
          })
        }}
      />
      {children}
    </>
  );
}
