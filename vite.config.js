import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const base = isProduction ? '/FloDrama/' : '/';
  
  return {
    base,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          // Pas besoin de transformer l'HTML, tout est déjà en place
          return html;
        }
      }
    ],
  };
});
