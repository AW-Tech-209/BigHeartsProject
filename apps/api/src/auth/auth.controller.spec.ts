import 'reflect-metadata';
import { describe, expect, it } from 'vitest';

import { AuthController } from './auth.controller';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/**
 * AC4 de HU-410: los dos endpoints de recuperación son públicos. El rate
 * limiting es global (`AuthThrottlerGuard` en `app.module.ts`), así que aquí
 * solo queda comprobar `@Public()`.
 */
describe('AuthController — recuperación de contraseña', () => {
  for (const handler of ['forgotPassword', 'resetPassword'] as const) {
    it(`${handler} es @Public()`, () => {
      const fn = AuthController.prototype[handler];

      expect(Reflect.getMetadata(IS_PUBLIC_KEY, fn)).toBe(true);
    });
  }
});
