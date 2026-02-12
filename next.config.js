/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Production domains
      {
        protocol: 'https',
        hostname: 'mystationlive.com',
      },
      {
        protocol: 'https',
        hostname: 'mystation.vercel.app',
      },
      // Merch image CDNs
      {
        protocol: 'https',
        hostname: 'images.printify.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.printful.com',
      },
      // Legacy domains
      {
        protocol: 'https',
        hostname: 'mystation.app',
      },
      {
        protocol: 'https',
        hostname: 'idmg.live',
      },
      // Localhost for development only
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
}

module.exports = nextConfig
