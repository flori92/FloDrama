/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  generateBuildId: () => 'flodrama-build',
  images: {
    unoptimized: true,
    domains: ['localhost', 'flodrama.com'],
  },
}

module.exports = nextConfig
