import 'reflect-metadata';
import { describe, expect, it } from 'vitest';

import { AuthController } from './auth.controller';
import { AuthThrottlerGuard } from './guards/auth-throttler.guard';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/**
 * AC4 de HU-410: los dos endpoints de recuperación son públicos y están bajo
 * rate limiting. Se comprueba por la metadata que dejan `@Public()` y
 * `@UseGuards(AuthThrottlerGuard)`, igual que ya hace `login`/`register`.
 */
describe('AuthController — recuperación de contraseña', () => {
  for (const handler of ['forgotPassword', 'resetPassword'] as const) {
    it(`${handler} es @Public() y usa AuthThrottlerGuard`, () => {
      const fn = AuthController.prototype[handler];

      const guards = Reflect.getMetadata('__guards__', fn) as unknown[] | undefined;
      expect(guards).toContain(AuthThrottlerGuard);

      expect(Reflect.getMetadata(IS_PUBLIC_KEY, fn)).toBe(true);
    });
  }
});
