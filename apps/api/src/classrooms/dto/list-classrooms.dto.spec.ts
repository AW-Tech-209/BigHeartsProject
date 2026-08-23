// `@Type(() => Number)` de `ListClassroomsDto` necesita el polyfill de
// metadatos de decoradores en runtime. `main.ts` ya lo importa para arrancar
// la app; este spec no pasa por ahí, así que lo trae él mismo.
import 'reflect-metadata';

import { CLASSROOMS_PAGE_SIZE_MAX, CommunicationPreference, EnglishLevel } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { ListClassroomsDto } from './list-classrooms.dto';

/** Valida un query plano (como llegaría en `req.query`, todo string) contra el DTO. */
async function camposInvalidos(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(ListClassroomsDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('ListClassroomsDto (validación)', () => {
  it('acepta un query vacío: todos los filtros son opcionales', async () => {
    expect(await camposInvalidos({})).toHaveLength(0);
  });

  it('acepta los filtros combinados', async () => {
    expect(
      await camposInvalidos({
        level: EnglishLevel.INTERMEDIATE,
        desde: '2099-01-01T00:00:00.000Z',
        hasta: '2099-12-31T23:59:59.000Z',
        communicationMode: CommunicationPreference.SIGN_LANGUAGE,
        page: '2',
        pageSize: '10',
      }),
    ).toHaveLength(0);
  });

  it('rechaza un nivel que no es de la lista', async () => {
    expect(await camposInvalidos({ level: 'EXPERTO' })).toContain('level');
  });

  // AC9: el filtro de modo es opcional y combinable, igual que los demás.
  it('rechaza un modo de comunicación que no es de la lista', async () => {
    expect(await camposInvalidos({ communicationMode: 'TELEPATIA' })).toContain(
      'communicationMode',
    );
  });

  it('acepta un modo de comunicación válido, solo', async () => {
    expect(
      await camposInvalidos({ communicationMode: CommunicationPreference.WRITTEN_TEXT }),
    ).toHaveLength(0);
  });

  it.each(['no-es-fecha', '2099-13-40'])(
    'rechaza desde con un formato inválido: %s',
    async (desde) => {
      expect(await camposInvalidos({ desde })).toContain('desde');
    },
  );

  it.each(['no-es-fecha', '2099-13-40'])(
    'rechaza hasta con un formato inválido: %s',
    async (hasta) => {
      expect(await camposInvalidos({ hasta })).toContain('hasta');
    },
  );

  // A4: la página y el tamaño llegan como texto en el query string.
  it('convierte page y pageSize de texto a número', async () => {
    const dto = plainToInstance(ListClassroomsDto, { page: '3', pageSize: '15' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(15);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rechaza una página inválida: %s', async (page) => {
    expect(await camposInvalidos({ page })).toContain('page');
  });

  // A4: el tope de pageSize existe para que nadie pida diez mil filas.
  it('rechaza un pageSize por encima del tope', async () => {
    expect(await camposInvalidos({ pageSize: String(CLASSROOMS_PAGE_SIZE_MAX + 1) })).toContain(
      'pageSize',
    );
  });

  it('acepta un pageSize igual al tope', async () => {
    expect(await camposInvalidos({ pageSize: String(CLASSROOMS_PAGE_SIZE_MAX) })).toHaveLength(0);
  });

  it.each(['0', '-1', 'abc'])('rechaza un pageSize inválido: %s', async (pageSize) => {
    expect(await camposInvalidos({ pageSize })).toContain('pageSize');
  });

  /**
   * HU-208, AC5/AC6. `mias` viaja por la URL, así que llega como texto y la
   * conversión importa: `Boolean('false')` es `true`, y con `@Type(() =>
   * Boolean)` un enlace compartido con `?mias=false` filtraría al revés de lo
   * que dice.
   */
  describe('filtro `mias` (HU-208)', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('convierte el texto %s en el booleano correspondiente', async (texto, esperado) => {
      const dto = plainToInstance(ListClassroomsDto, { mias: texto });

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.mias).toBe(esperado);
    });

    it('es opcional: sin él, el query sigue siendo válido', async () => {
      const dto = plainToInstance(ListClassroomsDto, {});

      expect(await validate(dto)).toHaveLength(0);
      expect(dto.mias).toBeUndefined();
    });

    // No se interpreta a ojo: se rechaza, igual que un pageSize fuera de rango.
    it.each(['1', 'si', 'TRUE', ''])(
      'rechaza un valor que no es true ni false: %s',
      async (mias) => {
        expect(await camposInvalidos({ mias })).toContain('mias');
      },
    );

    it('se combina con el resto de filtros', async () => {
      expect(
        await camposInvalidos({ mias: 'true', level: EnglishLevel.BEGINNER, page: '2' }),
      ).toHaveLength(0);
    });
  });
});
