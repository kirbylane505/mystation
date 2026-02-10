/**
 * MYSTATION - Dynamic XML Sitemap
 * Auto-generates sitemap for SEO
 */

import { tracks } from '@/data/tracks';

export default function sitemap() {
  const baseUrl = 'https://mystationlive.com';

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/music`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/merch`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/lotl`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/live`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/fan-zone`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/vault`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/artists/the-cubist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/account`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  // Dynamic song pages
  const songPages = (tracks || []).map(track => ({
    url: `${baseUrl}/song/${track.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...songPages];
}
