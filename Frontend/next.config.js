const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Active l'export statique pour GitHub Pages
  images: {
    unoptimized: true, // Désactive l'optimisation Next.js pour compatibilité export
  },
  trailingSlash: true, // Pour la compatibilité avec GitHub Pages
  basePath: '', // À ajuster si déployé dans un sous-répertoire
  assetPrefix: '/', // Préfixe pour les assets statiques (doit commencer par /)
  eslint: {
    ignoreDuringBuilds: true, // Désactive ESLint pendant le build
  },
  typescript: {
    ignoreBuildErrors: true, // Désactive la vérification TypeScript pendant le build
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
