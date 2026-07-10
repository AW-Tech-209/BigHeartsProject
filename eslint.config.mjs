// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default tseslint.config(
  {
    // Rutas que ESLint no debe mirar nunca, en todo el monorepo.
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.husky/**'],
  },

  // Base compartida: JS recomendado + TypeScript recomendado, sin type-checking.
  // No activamos las reglas "type-aware" a nivel raíz porque obligarían a que
  // cada archivo del repo perteneciera a un tsconfig; cada app puede subir el
  // nivel por su cuenta si lo necesita.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Permite variables/args intencionalmente sin usar si empiezan por "_".
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // NestJS usa mucho el patrón `constructor(private readonly x: X)`, que
      // dispara falsos positivos de clases "vacías".
      '@typescript-eslint/no-empty-function': 'off',
    },
  },

  // El frontend corre en navegador: añade los globals de DOM.
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // SIEMPRE el último: apaga toda regla de ESLint que compita con Prettier.
  prettier,
);
