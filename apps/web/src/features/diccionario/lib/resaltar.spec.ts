import { describe, expect, it } from 'vitest';

import { resaltar } from './resaltar';

describe('resaltar', () => {
  it('marca la coincidencia sin distinguir tildes ni mayúsculas, conservando el texto original', () => {
    expect(resaltar('Canción', 'CANCION')).toEqual([{ texto: 'Canción', coincide: true }]);
    expect(resaltar('Tomar, beber', 'beb')).toEqual([
      { texto: 'Tomar, ', coincide: false },
      { texto: 'beb', coincide: true },
      { texto: 'er', coincide: false },
    ]);
  });

  it('sin coincidencia o sin búsqueda devuelve el texto entero', () => {
    expect(resaltar('To eat', 'xyz')).toEqual([{ texto: 'To eat', coincide: false }]);
    expect(resaltar('To eat', '  ')).toEqual([{ texto: 'To eat', coincide: false }]);
  });
});
