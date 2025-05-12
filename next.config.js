/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pptqmiftahulkhoir.id',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;