const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Active l'export statique pour GitHub Pages
  images: {
    unoptimized: true, // Désactive l'optimisation Next.js pour compatibilité export
    domains: ['localhost'], // Autorise les images depuis localhost
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
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
    
    // Optimisations pour le bundling
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };
    
    return config;
  },
};

module.exports = nextConfig;
