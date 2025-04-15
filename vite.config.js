import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Plugin CSP simplifié intégré directement
const cspPlugin = () => ({
  name: 'vite-plugin-csp',
  transformIndexHtml(html) {
    // CSP plus permissive pour permettre les animations, transitions et ressources externes
    const cspContent = `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.flodrama.com; media-src 'self' blob: https:; worker-src 'self' blob:; frame-src 'self';`;
    
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

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
      jsxRuntime: 'automatic'
    }),
    cspPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.json']
  },
  // Configuration conditionnelle pour GitHub Pages en production et développement local
  base: process.env.NODE_ENV === 'production' ? '/FloDrama/' : '/',
  build: {
    target: 'es2020', // Mise à jour pour supporter top-level await
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          // Regrouper les dépendances React
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          
          // Regrouper les dépendances UI
          if (id.includes('node_modules/framer-motion') || 
              id.includes('node_modules/tailwindcss')) {
            return 'vendor-ui';
          }
          
          // Autres dépendances node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    minify: process.env.DEBUG ? false : 'esbuild'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion']
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://api.flodrama.com'),
    'process.env.VITE_APP_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_APP_BASE_URL': JSON.stringify(process.env.NODE_ENV === 'production' ? '/FloDrama/' : '/')
  }
});
