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

// Plugin pour assurer que les fichiers JSX sont servis avec le bon MIME type
const jsxMimeTypePlugin = () => ({
  name: 'vite-plugin-jsx-mime-type',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Intercepter les réponses pour les fichiers JSX
      const _end = res.end;
      res.end = function(chunk, ...args) {
        if (req.url && req.url.endsWith('.jsx')) {
          // Définir le bon type MIME pour les fichiers JSX
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        return _end.call(this, chunk, ...args);
      };
      next();
    });
  }
});

// Plugin pour transformer tous les imports .jsx en .js
const transformJsxImportsPlugin = () => ({
  name: 'vite-plugin-transform-jsx-imports',
  transform(code, id) {
    // Ne pas transformer les fichiers node_modules
    if (id.includes('node_modules')) {
      return null;
    }
    
    // Transformer les imports .jsx en .js
    if (id.endsWith('.js') || id.endsWith('.jsx')) {
      // Remplacer les imports de fichiers .jsx par .js
      const transformedCode = code.replace(/from\s+['"]([^'"]+)\.jsx['"]/g, "from '$1.js'");
      
      // Si le code a été modifié, le retourner
      if (transformedCode !== code) {
        return {
          code: transformedCode,
          map: null
        };
      }
    }
    
    return null;
  }
});

export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
      jsxRuntime: 'automatic',
      babel: {
        plugins: [
          // Ajouter des plugins Babel si nécessaire
        ],
        presets: [
          ['@babel/preset-react', { runtime: 'automatic' }]
        ]
      }
    }),
    cspPlugin(),
    jsxMimeTypePlugin(),
    transformJsxImportsPlugin()
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
        // Assurer que tous les fichiers JSX sont transformés en JS standard
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
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
  },
  esbuild: {
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx'
    },
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  }
});
