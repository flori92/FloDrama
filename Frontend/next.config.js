/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
    domains: ['localhost', 'flodrama.com'],
  },
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig
