import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/get_models': 'http://localhost:5000',
      '/set_model': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
    }
  }
});