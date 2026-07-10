/**
 * Conventional Commits.
 * Formato: <type>(<scope opcional>): <subject>
 * Ejemplos válidos:
 *   feat(api): añade health-check
 *   chore: configura husky
 */
export default {
  extends: ['@commitlint/config-conventional'],
};
