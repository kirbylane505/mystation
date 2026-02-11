/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'mystation.app', 'idmg.live'],
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
