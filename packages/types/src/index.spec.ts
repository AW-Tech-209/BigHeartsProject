import { describe, expect, it } from 'vitest';

import {
  ApiErrorCode,
  CommunicationPreference,
  HearingLossLevel,
  UserRole,
  UserStatus,
} from './index';

/**
 * Este paquete es casi todo tipos, que se borran al compilar. Lo que SÍ existe
 * en tiempo de ejecución —los enums y el catálogo de códigos de error— es
 * precisamente lo que se puede romper sin que TypeScript diga nada, así que es
 * lo que se prueba aquí.
 *
 * Cuando llegue `derivarEstadoAula()` (HU-203), sus tests van en su propio
 * `.spec.ts` junto a la función.
 */

/**
 * Estos enums viajan por la red y son, valor a valor, los mismos nombres que
 * los enums de Prisma. Renombrar un VALOR (no la clave) rompe el contrato con
 * la base de datos en silencio: TypeScript sigue compilando, y el fallo aparece
 * en producción como un `UserRole` que la BD no reconoce.
 */
const ENUMS_DEL_CONTRATO = {
  UserRole,
  UserStatus,
  HearingLossLevel,
  CommunicationPreference,
};

describe('enums del contrato', () => {
  it.each(Object.entries(ENUMS_DEL_CONTRATO))(
    '%s existe en tiempo de ejecución con todas sus claves iguales a sus valores',
    (_nombre, miembros) => {
      const entradas = Object.entries(miembros);

      expect(entradas.length).toBeGreaterThan(0);
      for (const [clave, valor] of entradas) {
        expect(valor).toBe(clave);
      }
    },
  );

  it('UserRole cubre los tres roles de la plataforma', () => {
    expect(Object.values(UserRole)).toEqual(['STUDENT', 'TEACHER', 'ADMIN']);
  });

  it('UserStatus no incluye ADMIN ni roles: son ejes distintos', () => {
    expect(Object.values(UserStatus)).toEqual(['ACTIVE', 'PENDING', 'SUSPENDED']);
  });
});

describe('ApiErrorCode', () => {
  it('usa la clave como valor, para que el código sea legible en la respuesta', () => {
    for (const [clave, valor] of Object.entries(ApiErrorCode)) {
      expect(valor).toBe(clave);
    }
  });

  it('no repite ningún código', () => {
    const valores = Object.values(ApiErrorCode);

    expect(new Set(valores).size).toBe(valores.length);
  });

  it('mantiene los códigos que el frontend ya distingue en el login', () => {
    // Si alguno de estos se renombra, `toLoginErrorNotice()` deja de reconocer
    // el error y el usuario recibe el mensaje genérico en vez de la explicación.
    expect(ApiErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
    expect(ApiErrorCode.ACCOUNT_PENDING).toBe('ACCOUNT_PENDING');
    expect(ApiErrorCode.ACCOUNT_SUSPENDED).toBe('ACCOUNT_SUSPENDED');
    expect(ApiErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });
});
