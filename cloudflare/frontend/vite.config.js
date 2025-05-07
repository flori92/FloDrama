import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('framer-motion')) {
              return 'ui';
            }
            if (id.includes('hls.js')) {
              return 'player';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://flodrama-api-prod.florifavi.workers.dev'),
    'process.env.VITE_STREAM_DOMAIN': JSON.stringify(process.env.VITE_STREAM_DOMAIN || 'customer-ehlynuge6dnzfnfd.cloudflarestream.com'),
    'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
    'process.env.VITE_APP_NAME': JSON.stringify(process.env.npm_package_name),
  },
  // Configuration spécifique pour Cloudflare Pages
  base: './',
});
