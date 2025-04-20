/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Active l'export statique pour GitHub Pages
  images: {
    unoptimized: true, // Désactive l'optimisation Next.js pour compatibilité export
  },
  trailingSlash: true, // Pour la compatibilité avec GitHub Pages
  basePath: '', // À ajuster si déployé dans un sous-répertoire
  eslint: {
    ignoreDuringBuilds: true, // Désactive ESLint pendant le build
  },
  typescript: {
    ignoreBuildErrors: true, // Désactive la vérification TypeScript pendant le build
  },
};

module.exports = nextConfig;
