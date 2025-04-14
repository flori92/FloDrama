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
    react(),
    cspPlugin()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  // Point d'entrée JavaScript au lieu de TypeScript
  build: {
    // Configuration pour CloudFront
    base: 'https://d1323ouxr1qbdp.cloudfront.net/',
    // Augmenter la limite d'avertissement pour les chunks
    chunkSizeWarningLimit: 600,
    // Spécifier le point d'entrée principal
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: (id) => {
          // Regrouper les modules React
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          // Regrouper les modules d'UI
          if (id.includes('node_modules/@mui') || 
              id.includes('node_modules/@emotion')) {
            return 'ui-vendor';
          }
          // Autres modules tiers
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    },
    // Optimisation pour la production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Désactiver les vérifications TypeScript strictes pour le build
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Ignorer les erreurs TypeScript pour permettre le build
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noEmit: true,
        allowJs: true,
        checkJs: false,
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: 'node',
        isolatedModules: true
      }
    }
  },
  // Configuration pour le serveur de développement
  server: {
    port: 3000,
    open: true,
    cors: true,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    // Proxy pour les appels API vers AWS
    proxy: {
      '/api/scraping': {
        target: process.env.AWS_API_ENDPOINT || 'https://yqek2f5uph.execute-api.us-east-1.amazonaws.com/prod',
        changeOrigin: true,
        secure: true,
        headers: {
          'x-api-key': process.env.AWS_API_KEY || ''
        }
      }
    }
  },
  // Configuration pour les tests
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  // Optimisation des performances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
