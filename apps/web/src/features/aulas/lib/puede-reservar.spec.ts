import { UserRole } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { usuarioDePrueba } from '@/test/sesion';
import { puedeReservar } from './puede-reservar';

/**
 * HU-208, AC4. **Un test por rol**, que es como lo pide el criterio.
 *
 * Vive aquí y no solo en la tarjeta a propósito: la regla es «solo `STUDENT`
 * reserva» (§4.8, regla 1), no «la tarjeta del catálogo no pinta un botón».
 * Cuando HU-301 traiga la acción de verdad, esta es la garantía que ya estaba
 * puesta y que no se puede romper sin ponerse en rojo.
 */
describe('puedeReservar — solo el estudiante reserva (§4.8, regla 1)', () => {
  it('un estudiante puede', () => {
    expect(puedeReservar(usuarioDePrueba(UserRole.STUDENT))).toBe(true);
  });

  it.each([UserRole.TEACHER, UserRole.ADMIN])('un %s no puede', (role) => {
    expect(puedeReservar(usuarioDePrueba(role))).toBe(false);
  });

  it.each([null, undefined])('sin sesión (%s) no puede', (sinUsuario) => {
    expect(puedeReservar(sinUsuario)).toBe(false);
  });
});
