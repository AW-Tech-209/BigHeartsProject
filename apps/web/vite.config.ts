import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // Vite excluye del pre-bundling las dependencias enlazadas (symlinks de
    // workspace). Como @academia/types se publica en CommonJS, hay que
    // incluirlo explícitamente para que esbuild lo convierta a ESM.
    include: ['@academia/types'],
  },
});
