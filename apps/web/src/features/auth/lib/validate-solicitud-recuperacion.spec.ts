import { describe, expect, it } from 'vitest';

import { validateSolicitudRecuperacion } from './validate-solicitud-recuperacion';

describe('validateSolicitudRecuperacion', () => {
  it('exige un email', () => {
    expect(validateSolicitudRecuperacion('   ')).toBe('El email es obligatorio.');
  });

  it('exige que tenga forma de email', () => {
    expect(validateSolicitudRecuperacion('sin-arroba')).toBe(
      'El email no tiene un formato válido.',
    );
  });

  it('acepta un email con forma válida', () => {
    expect(validateSolicitudRecuperacion('ana@correo.com')).toBeUndefined();
  });
});
