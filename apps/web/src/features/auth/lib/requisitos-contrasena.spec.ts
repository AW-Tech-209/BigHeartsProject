import { describe, expect, it } from 'vitest';

import { requisitosContrasena } from './requisitos-contrasena';

describe('requisitosContrasena', () => {
  it('marca cada requisito por separado', () => {
    expect(requisitosContrasena('abc').map((r) => r.cumple)).toEqual([false, true, false]);
    expect(requisitosContrasena('abcdefg1').every((r) => r.cumple)).toBe(true);
  });
});
