import {
  ClassroomSupport,
  EnglishLevel,
  InstructionMode,
  type UpdateClassroomInput,
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

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const INT4_MAX = 2147483647;

/**
 * DTO de `PATCH /classrooms/:id` (HU-202, extiende HU-211 — decisión D25).
 *
 * **Todo opcional.** Un campo ausente deja el dato como estaba (AC5); las
 * mismas reglas que `CreateClassroomDto`, pero sin `@IsNotEmpty`/`ArrayNotEmpty`
 * a secas: eso obligaría a mandarlo siempre. `@IsOptional()` las combina con
 * "si viene, tiene que ser válido".
 */
export class UpdateClassroomDto implements UpdateClassroomInput {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Ponle un nombre a la clase.' })
  @MaxLength(120, { message: 'El nombre de la clase no puede superar los 120 caracteres.' })
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Describe de qué trata la clase.' })
  @MaxLength(2000, { message: 'La descripción no puede superar los 2000 caracteres.' })
  description?: string;

  @IsOptional()
  @IsEnum(EnglishLevel, { message: 'Elige un nivel: básico, intermedio o avanzado.' })
  level?: EnglishLevel;

  @IsOptional()
  @IsInt({ message: 'El cupo máximo debe ser un número entero.' })
  @Min(1, { message: 'El cupo máximo debe ser al menos 1 estudiante.' })
  @Max(INT4_MAX, { message: 'Ese cupo máximo es demasiado grande.' })
  maxStudents?: number;

  @IsOptional()
  @EsInstanteFuturo()
  scheduledAt?: string;

  @IsOptional()
  @IsInt({ message: 'La duración debe ser un número entero de minutos.' })
  @Min(1, { message: 'La duración debe ser de al menos 1 minuto.' })
  @Max(INT4_MAX, { message: 'Esa duración es demasiado larga.' })
  durationMinutes?: number;

  // La plataforma se deriva de nuevo si el enlace cambia (D45); no se valida
  // aquí por el mismo motivo que en `CreateClassroomDto`.
  @IsOptional()
  @Transform(trim)
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    {
      message:
        'Pega el enlace completo de la reunión, empezando por https:// (por ejemplo, https://meet.google.com/abc-defg-hij).',
    },
  )
  @MaxLength(2048, { message: 'El enlace es demasiado largo.' })
  meetingLink?: string;

  @IsOptional()
  @IsEnum(InstructionMode, {
    message: 'Elige en qué modo se imparte la clase: LSC nativa o con intérprete de LSC.',
  })
  instructionMode?: InstructionMode;

  @IsOptional()
  @IsArray()
  @IsEnum(ClassroomSupport, { each: true, message: 'Elige apoyos válidos.' })
  supports?: ClassroomSupport[];

  @IsOptional()
  @IsBoolean({ message: 'Confirma si quieres publicar con poca antelación.' })
  confirmarPocaAntelacion?: boolean;
}
