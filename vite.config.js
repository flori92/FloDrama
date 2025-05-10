import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Limiter l'accès au serveur de développement à localhost uniquement
    host: '127.0.0.1',
    strictPort: true,
    origin: 'http://127.0.0.1:5173',
    cors: false,
    hmr: {
      // Limiter HMR à localhost uniquement
      host: '127.0.0.1',
      protocol: 'ws'
    },
    headers: {
      // Ajouter des en-têtes de sécurité
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    // Optimisations de sécurité pour la construction
    sourcemap: false,
    // Minimiser le code pour la production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
