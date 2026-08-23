import {
  CLASSROOMS_PAGE_SIZE_MAX,
  CommunicationPreference,
  EnglishLevel,
  type ListClassroomsQuery,
} from '@academia/types';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

/**
 * DTO de `GET /classrooms`. Implementa `ListClassroomsQuery` de
 * @academia/types, igual que `CreateClassroomDto` implementa
 * `CreateClassroomInput`. Todo opcional y combinable (A1).
 *
 * `page`/`pageSize` llegan como texto en el query string incluso con el
 * `ValidationPipe` global en `transform: true` — necesitan `@Type(() =>
 * Number)` de `class-transformer` para convertirse antes de que
 * `class-validator` los evalúe.
 */
export class ListClassroomsDto implements ListClassroomsQuery {
  @IsOptional()
  @IsEnum(EnglishLevel, { message: 'Elige un nivel: básico, intermedio o avanzado.' })
  level?: EnglishLevel;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de inicio del rango no es válida.' })
  desde?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'La fecha de fin del rango no es válida.' })
  hasta?: string;

  // AC9: combinable con `level`, `desde` y `hasta`. No viene puesto por
  // defecto en ninguna pantalla — el catálogo destaca la coincidencia con la
  // preferencia del estudiante, nunca filtra por ella (§4.9, regla 1).
  @IsOptional()
  @IsEnum(CommunicationPreference, { message: 'Elige un modo de comunicación válido.' })
  communicationMode?: CommunicationPreference;

  /**
   * AC5: solo las aulas de quien pregunta. **No lleva id** — el `teacherId` lo
   * pone el servicio desde el token (§4.8, regla 3).
   *
   * `@Type(() => Boolean)` no sirve aquí: `Boolean('false')` es `true`, así que
   * `?mias=false` acabaría filtrando. El `@Transform` traduce solo las dos
   * cadenas que significan algo y deja pasar cualquier otra sin tocar, para que
   * `@IsBoolean()` la rechace con `VALIDATION_ERROR` en vez de interpretarla a
   * ojo — mismo criterio que `pageSize`, que tampoco se recorta en silencio.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'El filtro de mis clases solo acepta true o false.' })
  mias?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser al menos 1.' })
  page?: number;

  // Tope explícito (A4): sin él, cualquiera podría pedir diez mil filas de un
  // tirón. Pedir uno mayor no se recorta en silencio: se rechaza con
  // VALIDATION_ERROR, igual que cualquier otro campo fuera de rango.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tamaño de página debe ser un número entero.' })
  @Min(1, { message: 'El tamaño de página debe ser al menos 1.' })
  @Max(CLASSROOMS_PAGE_SIZE_MAX, {
    message: `El tamaño de página no puede superar ${CLASSROOMS_PAGE_SIZE_MAX}.`,
  })
  pageSize?: number;
}
