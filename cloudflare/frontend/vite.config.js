import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://flodrama-api.florifavi.workers.dev'),
    'process.env.VITE_STREAM_DOMAIN': JSON.stringify(process.env.VITE_STREAM_DOMAIN || 'customer-ehlynuge6dnzfnfd.cloudflarestream.com'),
  },
});
