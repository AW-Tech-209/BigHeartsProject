import { describe, expect, it } from 'vitest';

import {
  ApiErrorCode,
  BookingStatus,
  ClassroomStatus,
  CommunicationPreference,
  EnglishLevel,
  HearingLossLevel,
  MeetingProvider,
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
  EnglishLevel,
  ClassroomStatus,
  MeetingProvider,
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
    expect(Object.values(UserStatus)).toEqual(['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED']);
  });

  /**
   * `REJECTED` y `SUSPENDED` son estados SEPARADOS y tienen que seguir
   * siéndolo (decisión D13, `docs/ARQUITECTURA.md` §4.5). Colapsarlos ahorraría
   * una migración y obligaría a decirle a un profesor rechazado que su cuenta
   * «fue suspendida», que es falso: nunca llegó a estar activa. Este test
   * existe para que ese ahorro no se cuele sin que nadie lo note.
   */
  it('REJECTED y SUSPENDED son estados distintos, no alias', () => {
    expect(UserStatus.REJECTED).not.toBe(UserStatus.SUSPENDED);
  });

  it('EnglishLevel son los tres niveles con los que el estudiante elige', () => {
    expect(Object.values(EnglishLevel)).toEqual(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
  });

  /**
   * `DRAFT` y `COMPLETED` no tienen escritor en Fase 1 (D15 y D16), pero SÍ
   * tienen que seguir en el enum: la columna de la BD los declara y borrarlos de
   * aquí desincronizaría el contrato con `schema.prisma`, que es justo lo que el
   * test de arriba no puede detectar solo.
   */
  it('ClassroomStatus mantiene los cuatro estados, incluidos los que nadie escribe todavía', () => {
    expect(Object.values(ClassroomStatus)).toEqual([
      'DRAFT',
      'PUBLISHED',
      'CANCELLED',
      'COMPLETED',
    ]);
  });

  it('MeetingProvider incluye MANUAL, que es el único que la Fase 1 escribe', () => {
    expect(MeetingProvider.MANUAL).toBe('MANUAL');
    expect(Object.values(MeetingProvider)).toHaveLength(4);
  });

  /**
   * `BookingStatus` está fuera de `ENUMS_DEL_CONTRATO` porque **todavía no
   * tiene gemelo en `schema.prisma`**: el modelo `Booking` llega en el Sprint 3.
   * Se declara desde HU-204 para poder tipar `ClassroomDetail.myBookingStatus`,
   * y sus miembros son los que fija `docs/ARQUITECTURA.md` §7.2 — este test es
   * lo que hará que la migración de HU-301 se escriba contra ellos y no contra
   * otros inventados por el camino.
   */
  it('BookingStatus son los cuatro estados que §7.2 especifica para Booking', () => {
    expect(Object.values(BookingStatus)).toEqual(['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW']);
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
