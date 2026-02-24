const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'mystationlive.com' },
      { protocol: 'https', hostname: 'mystation.vercel.app' },
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: 'e-cdns-images.dzcdn.net' },
      { protocol: 'https', hostname: 'cdns-images.dzcdn.net' },
      { protocol: 'https', hostname: 'api.deezer.com' },
      { protocol: 'https', hostname: 'images.printify.com' },
      { protocol: 'https', hostname: 'images-api.printify.com' },
      { protocol: 'https', hostname: 'cdn.printful.com' },
      { protocol: 'https', hostname: 'mystation.app' },
      { protocol: 'https', hostname: 'idmg.live' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      ...(process.env.NODE_ENV === 'development'
        ? [{ protocol: 'http', hostname: 'localhost' }]
        : []),
    ],
  },
  async redirects() {
    return [
      {
        source: '/cubist',
        destination: '/artists/the-cubist',
        permanent: true,
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
