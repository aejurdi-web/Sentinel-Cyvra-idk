import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  root: 'src/renderer',
  base: mode === 'development' ? '/' : './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/renderer/index.html'
    }
  },
  plugins: [react()],
  server: {
    port: 5174
  }
}));
