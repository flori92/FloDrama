import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Plugin personnalisé pour gérer la CSP
const cspPlugin = () => ({
  name: 'vite-plugin-csp',
  transformIndexHtml(html) {
    const cspContent = `default-src * 'self' data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval' https://d1323ouxr1qbdp.cloudfront.net https://flodrama-app-bucket.s3.amazonaws.com; script-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval' https://d1323ouxr1qbdp.cloudfront.net https://flodrama-app-bucket.s3.amazonaws.com https://cdn.jsdelivr.net; style-src * 'self' data: blob: 'unsafe-inline' https://fonts.googleapis.com https://d1323ouxr1qbdp.cloudfront.net https://flodrama-app-bucket.s3.amazonaws.com; img-src * 'self' data: blob: https://d1323ouxr1qbdp.cloudfront.net https://flodrama-app-bucket.s3.amazonaws.com; font-src * 'self' data: blob: https://fonts.gstatic.com; connect-src * 'self' https://d1323ouxr1qbdp.cloudfront.net https://flodrama-app-bucket.s3.amazonaws.com;`;
    
    // Remplacer ou ajouter la balise meta CSP
    if (html.includes('Content-Security-Policy')) {
      return html.replace(
        /<meta[^>]*Content-Security-Policy[^>]*>/,
        `<meta http-equiv="Content-Security-Policy" content="${cspContent}">`
      );
    } else {
      return html.replace(
        '</head>',
        `  <meta http-equiv="Content-Security-Policy" content="${cspContent}">\n  </head>`
      );
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configuration explicite pour traiter les fichiers .js comme JSX
      include: ['**/*.jsx', '**/*.js'],
      jsxRuntime: 'automatic'
    }),
    cspPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  // Configuration conditionnelle pour GitHub Pages en production et développement local
  base: process.env.NODE_ENV === 'production' ? '/FloDrama/' : '/',
  build: {
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 600,
    // Spécifier le point d'entrée principal
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      // Ajouter les modules externes qui posent problème lors du build
      external: ['socket.io-client', '@vitalets/google-translate-api', 'ioredis'],
      output: {
        manualChunks: (id) => {
          // Regrouper les dépendances React dans un seul chunk
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler')) {
            return 'react-vendor';
          }
          // Regrouper les autres dépendances communes
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Améliorer la compatibilité avec les navigateurs
    target: 'es2015',
    // Désactiver la minification pour le débogage en production si nécessaire
    minify: process.env.DEBUG ? false : 'esbuild'
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  // Configuration du serveur de développement
  server: {
    port: 3000,
    open: true
  }
});
