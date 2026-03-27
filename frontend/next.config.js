/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendBase =
      process.env.BACKEND_API_URL ||
      process.env.API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL;

    if (!backendBase || backendBase.startsWith('/')) {
      return [];
    }

    const normalized = backendBase.replace(/\/$/, '');

    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${normalized}/:path*`,
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;