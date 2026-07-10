import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  optimizeDeps: {
    // NO BORRAR esta línea.
    //
    // Vite excluye del pre-bundling las dependencias enlazadas por symlink
    // (los workspaces del monorepo), asumiendo que son fuentes ESM que ya sabe
    // procesar. Pero @academia/types se compila a CommonJS, porque la API de
    // NestJS lo consume con require().
    //
    // Si se quita, el build sigue pasando pero el navegador revienta en cuanto
    // se importa un VALOR del paquete (p. ej. el enum UserRole), porque
    // esbuild nunca convirtió el módulo CJS a ESM.
    include: ['@academia/types'],
  },
});
