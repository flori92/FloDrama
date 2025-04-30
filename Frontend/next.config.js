/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['flodrama.com'],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
}

module.exports = nextConfig
