/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Active l'export statique pour GitHub Pages
  images: {
    unoptimized: true, // Désactive l'optimisation Next.js pour compatibilité export
  },
  trailingSlash: true, // Pour la compatibilité avec GitHub Pages
  basePath: '', // À ajuster si déployé dans un sous-répertoire
};

module.exports = nextConfig;
