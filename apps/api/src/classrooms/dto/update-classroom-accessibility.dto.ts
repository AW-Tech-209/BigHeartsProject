import {
  CommunicationPreference,
  type MeetingProvider,
  type UpdateClassroomAccessibilityInput,
} from '@academia/types';
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';

import { PLATAFORMAS_OFRECIDAS } from './create-classroom.dto';

/**
 * DTO de `PATCH /classrooms/:id` (HU-211). Implementa
 * `UpdateClassroomAccessibilityInput` de @academia/types.
 *
 * **Deliberadamente acotado a los 5 campos de accesibilidad** — ver el
 * doc-comment del tipo compartido y la decisión D25 de `ARQUITECTURA.md`. No
 * es el DTO de edición general del aula: ese lo trae HU-202, y extenderá este
 * mismo endpoint, no lo reemplazará.
 *
 * `communicationModes` es obligatorio y no vacío, igual que en la creación:
 * la única razón de que este endpoint exista ahora es sacar a un aula de «sin
 * indicar» (§4.9, decisión 5), y un `PATCH` que lo dejara vacío no cumpliría
 * ese propósito. Los apoyos y la plataforma sí son opcionales — omitir uno lo
 * deja como estaba.
 */
export class UpdateClassroomAccessibilityDto implements UpdateClassroomAccessibilityInput {
  @IsArray()
  @ArrayNotEmpty({ message: 'Elige al menos un modo en que se imparte la clase.' })
  @IsEnum(CommunicationPreference, {
    each: true,
    message: 'Elige modos de comunicación válidos.',
  })
  communicationModes!: CommunicationPreference[];

  @IsOptional()
  @IsBoolean({ message: 'Indica si hay intérprete de lengua de señas.' })
  hasInterpreter?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Indica si hay subtítulos en vivo.' })
  hasLiveCaptions?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Indica si hay materiales visuales de apoyo.' })
  hasVisualMaterials?: boolean;

  // Misma lista acotada que en la creación: `DAILY` sigue sin ofrecerse.
  @IsOptional()
  @IsIn(PLATAFORMAS_OFRECIDAS, { message: 'Elige la plataforma: Zoom, Meet u otra.' })
  meetingProvider?: MeetingProvider;
}
