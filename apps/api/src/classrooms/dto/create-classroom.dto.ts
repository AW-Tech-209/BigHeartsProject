import {
  ClassroomSupport,
  type CreateClassroomInput,
  EnglishLevel,
  InstructionMode,
} from '@academia/types';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { EsInstanteFuturo } from './es-instante-futuro.validator';

/** Normaliza strings: recorta espacios. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Tope de las columnas `Int` de PostgreSQL. **No es una regla de negocio**: es
 * el límite físico de la columna. Sin él, `maxStudents: 9999999999` llega a
 * Postgres, la inserción revienta y el profesor recibe un 500 en vez de un
 * error de campo que pueda corregir.
 */
const INT4_MAX = 2147483647;

/**
 * DTO de `POST /classrooms`. Implementa `CreateClassroomInput` de
 * @academia/types (el contrato compartido) y le añade las reglas de validación.
 * Los mensajes están en español porque llegan al profesor.
 *
 * **Lo que NO está aquí importa tanto como lo que sí.** No hay `teacherId`,
 * `status`, `currentBookings`, `meetingProvider` ni `isRecurring`: son
 * decisiones del servidor, no del formulario. Y como el `ValidationPipe` global
 * corre con `whitelist` + `forbidNonWhitelisted`, mandarlos en el cuerpo no se
 * ignora en silencio — se rechaza con `VALIDATION_ERROR`. Esa es la defensa
 * contra mass-assignment que hace cierto el AC3: el aula se asigna siempre al
 * usuario del token, porque el cuerpo no tiene forma de nombrar a otro.
 */
export class CreateClassroomDto implements CreateClassroomInput {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Ponle un nombre a la clase.' })
  @MaxLength(120, { message: 'El nombre de la clase no puede superar los 120 caracteres.' })
  title!: string;

  // Obligatoria: es el texto con el que un estudiante decide si esta clase es
  // para él. `docs/ARQUITECTURA.md` §7.2 la modela como columna NOT NULL.
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Describe de qué trata la clase.' })
  @MaxLength(2000, { message: 'La descripción no puede superar los 2000 caracteres.' })
  description!: string;

  @IsEnum(EnglishLevel, { message: 'Elige un nivel: básico, intermedio o avanzado.' })
  level!: EnglishLevel;

  @IsInt({ message: 'El cupo máximo debe ser un número entero.' })
  @Min(1, { message: 'El cupo máximo debe ser al menos 1 estudiante.' })
  @Max(INT4_MAX, { message: 'Ese cupo máximo es demasiado grande.' })
  maxStudents!: number;

  // Futuro y con zona horaria explícita. La comprobación es del servidor: ver
  // `es-instante-futuro.validator.ts`.
  @EsInstanteFuturo()
  scheduledAt!: string;

  @IsInt({ message: 'La duración debe ser un número entero de minutos.' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto.' })
  @Max(INT4_MAX, { message: 'Esa duración es demasiado larga.' })
  durationMinutes!: number;

  // `require_protocol` obliga a que el profesor pegue la URL entera. Un
  // `meet.google.com/abc` sin esquema se guardaría, y el enlace que el
  // estudiante abriría 30 minutos antes de su clase no llevaría a ninguna parte
  // — que es justo el momento en el que el producto no se puede permitir fallar.
  //
  // La plataforma (Zoom, Meet o Teams) no se valida aquí: la deriva el
  // servicio con `esProveedorPermitido()` (D45), porque el código de rechazo
  // es propio (`MEETING_PROVIDER_NOT_ALLOWED`), no un `VALIDATION_ERROR`.
  @Transform(trim)
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    {
      message:
        'Pega el enlace completo de la reunión, empezando por https:// (por ejemplo, https://meet.google.com/abc-defg-hij).',
    },
  )
  @MaxLength(2048, { message: 'El enlace es demasiado largo.' })
  meetingLink!: string;

  // Obligatorio (§4.9, D42), pero sin `@IsNotEmpty`/rechazo aquí: ausente
  // responde el código propio `INSTRUCTION_MODE_REQUIRED`, que decide el
  // servicio, no un `VALIDATION_ERROR` genérico del pipe.
  @IsOptional()
  @IsEnum(InstructionMode, {
    message: 'Elige en qué modo se imparte la clase: LSC nativa o con intérprete de LSC.',
  })
  instructionMode!: InstructionMode;

  @IsOptional()
  @IsArray()
  @IsEnum(ClassroomSupport, { each: true, message: 'Elige apoyos válidos.' })
  supports?: ClassroomSupport[];

  /**
   * El profesor ya vio el aviso de poca antelación y decidió publicar igual
   * (HU-212, AC7).
   *
   * **El único campo de este DTO que no describe el aula.** No se persiste ni
   * vuelve en la respuesta: es el acuse de recibo de un aviso, y por eso el
   * servicio lo lee y lo tira. Sin él, un `scheduledAt` por debajo de
   * `CLASS_MIN_LEAD_MINUTES` responde `CLASSROOM_LEAD_TIME_WARNING`; con él en
   * `true`, la misma petición se acepta.
   *
   * Viaja en el cuerpo y no como query porque ningún `POST` del repo mezcla las
   * dos cosas. Y **no está aquí como excepción a las otras dos reglas**: el
   * solapamiento y la duración bloquean con este flag puesto exactamente igual
   * que sin él.
   */
  @IsOptional()
  @IsBoolean({ message: 'Confirma si quieres publicar con poca antelación.' })
  confirmarPocaAntelacion?: boolean;
}
