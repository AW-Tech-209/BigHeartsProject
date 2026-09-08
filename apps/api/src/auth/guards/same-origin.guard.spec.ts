import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { SameOriginGuard } from './same-origin.guard';

function contextConCabecera(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('SameOriginGuard', () => {
  const guard = new SameOriginGuard();

  it('deja pasar con la cabecera correcta', () => {
    expect(guard.canActivate(contextConCabecera({ 'x-requested-with': 'bighearts' }))).toBe(true);
  });

  it('rechaza sin la cabecera (un <form> autoenviado no puede fijarla)', () => {
    expect(() => guard.canActivate(contextConCabecera({}))).toThrow();
  });

  it('rechaza con un valor distinto', () => {
    expect(() =>
      guard.canActivate(contextConCabecera({ 'x-requested-with': 'XMLHttpRequest' })),
    ).toThrow();
  });
});
