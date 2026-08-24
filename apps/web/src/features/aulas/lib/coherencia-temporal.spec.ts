import { describe, expect, it } from 'vitest';

import {
  detallesDeAntelacion,
  detallesDeDuracion,
  detallesDeSolapamiento,
  mensajeDeSolapamiento,
} from './coherencia-temporal';
import { aInstanteISO } from './horario';

const SOLAPAMIENTO = {
  conflictoId: '33333333-3333-4333-8333-333333333333',
  conflictoTitulo: 'Conversación cotidiana',
  conflictoScheduledAt: aInstanteISO({ fecha: '2027-08-12', hora: '18:00' })!,
  conflictoDurationMinutes: 60,
};

describe('mensajeDeSolapamiento (AC5)', () => {
  const mensaje = mensajeDeSolapamiento(SOLAPAMIENTO);

  it('nombra el aula con la que se choca, entrecomillada', () => {
    // Esto es el AC5 entero. Sin el nombre, el profesor tiene que abrir sus
    // aulas y buscar a mano cuál de ellas ocupa el horario.
    expect(mensaje).toContain('«Conversación cotidiana»');
  });

  it('dice el horario ocupado, no solo que hay conflicto', () => {
    expect(mensaje).toMatch(/jueves/i);
    expect(mensaje).toMatch(/de 6:00/);
    expect(mensaje).toMatch(/a 7:00/);
  });

  it('termina diciendo qué hacer, porque este error no se puede confirmar', () => {
    expect(mensaje).toMatch(/elige otra hora u otro día/i);
  });
});

/**
 * Los `details` llegan por la red como `Record<string, unknown>`: nadie
 * garantiza su forma. Un `as` a secas sobre ellos pondría un `undefined` en
 * mitad de un mensaje que lee un profesor el día que la API y el frontend se
 * desplieguen desincronizados.
 */
describe('lectura de los details', () => {
  it('acepta el details completo del solapamiento', () => {
    expect(detallesDeSolapamiento({ ...SOLAPAMIENTO })).toEqual(SOLAPAMIENTO);
  });

  it.each([
    ['sin details', undefined],
    ['sin título', { ...SOLAPAMIENTO, conflictoTitulo: undefined }],
    ['con el título vacío', { ...SOLAPAMIENTO, conflictoTitulo: '' }],
    ['con la duración como texto', { ...SOLAPAMIENTO, conflictoDurationMinutes: '60' }],
  ])('rechaza un details %s', (_caso, details) => {
    expect(detallesDeSolapamiento(details as Record<string, unknown> | undefined)).toBeNull();
  });

  it('lee el tope de duración', () => {
    expect(detallesDeDuracion({ maximoMinutos: 90 })).toEqual({ maximoMinutos: 90 });
    expect(detallesDeDuracion({ maximoMinutos: Number.NaN })).toBeNull();
    expect(detallesDeDuracion(undefined)).toBeNull();
  });

  it('lee los dos números del aviso de antelación', () => {
    expect(detallesDeAntelacion({ minutosDeAntelacion: 45, minimoMinutos: 60 })).toEqual({
      minutosDeAntelacion: 45,
      minimoMinutos: 60,
    });
    // Con uno solo no se puede explicar la consecuencia, y un diálogo que pide
    // confirmar sin decir qué pasa no es una decisión.
    expect(detallesDeAntelacion({ minutosDeAntelacion: 45 })).toBeNull();
  });

  it('acepta cero minutos de antelación: el reloj que cuenta es el del servidor', () => {
    expect(detallesDeAntelacion({ minutosDeAntelacion: 0, minimoMinutos: 60 })).not.toBeNull();
  });
});
