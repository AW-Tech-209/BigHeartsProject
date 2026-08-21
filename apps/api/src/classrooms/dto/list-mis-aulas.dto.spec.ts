// `@Type(() => Number)` de `ListMisAulasDto` necesita el polyfill de metadatos
// de decoradores en runtime. `main.ts` ya lo importa para arrancar la app; este
// spec no pasa por ahí, así que lo trae él mismo.
import 'reflect-metadata';

import { CLASSROOMS_PAGE_SIZE_MAX, EstadoTemporalAula } from '@academia/types';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { ListMisAulasDto } from './list-mis-aulas.dto';

/** Valida un query plano (como llegaría en `req.query`, todo string) contra el DTO. */
async function camposInvalidos(payload: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(ListMisAulasDto, payload);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('ListMisAulasDto (validación)', () => {
  it('acepta un query vacío: el filtro es opcional y por defecto son todas', async () => {
    expect(await camposInvalidos({})).toHaveLength(0);
  });

  it.each(Object.values(EstadoTemporalAula))('acepta el estado %s', async (estado) => {
    expect(await camposInvalidos({ estado })).toHaveLength(0);
  });

  it('rechaza un estado que no es de la lista', async () => {
    expect(await camposInvalidos({ estado: 'archivadas' })).toContain('estado');
  });

  /**
   * El valor va en minúscula porque viaja en la URL. Aceptar también
   * `PROXIMAS` daría dos enlaces distintos para la misma vista, y el AC6 pide
   * que copiar el enlace reproduzca exactamente lo que se veía.
   */
  it('rechaza el estado en mayúsculas: la URL tiene una sola forma', async () => {
    expect(await camposInvalidos({ estado: 'PROXIMAS' })).toContain('estado');
  });

  it('convierte page y pageSize de texto a número', async () => {
    const dto = plainToInstance(ListMisAulasDto, { page: '3', pageSize: '15' });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.page).toBe(3);
    expect(dto.pageSize).toBe(15);
  });

  it.each(['0', '-1', '1.5', 'abc'])('rechaza una página inválida: %s', async (page) => {
    expect(await camposInvalidos({ page })).toContain('page');
  });

  // Mismo tope que el catálogo (A5): un solo contrato de paginación.
  it('rechaza un pageSize por encima del tope', async () => {
    expect(await camposInvalidos({ pageSize: String(CLASSROOMS_PAGE_SIZE_MAX + 1) })).toContain(
      'pageSize',
    );
  });
});
