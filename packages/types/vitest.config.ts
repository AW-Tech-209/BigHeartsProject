import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // Aquí solo viven tipos, enums y funciones puras del contrato: nada toca el
    // DOM. jsdom costaría arranque y no compraría nada.
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
