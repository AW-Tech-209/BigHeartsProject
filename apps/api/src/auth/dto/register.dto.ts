import {
  CommunicationPreference,
  HearingLossLevel,
  type RegisterableRole,
  type RegisterInput,
  UserRole,
} from '@academia/types';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Normaliza strings: recorta espacios. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO de `POST /auth/register`. Implementa `RegisterInput` de @academia/types
 * (el contrato compartido) y le añade las reglas de validación con
 * class-validator. Los mensajes están en español porque llegan al usuario.
 */
export class RegisterDto implements RegisterInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  // Tope de 72 bytes: bcrypt trunca a partir de ahí, así que aceptar más daría
  // una falsa sensación de seguridad.
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La contraseña debe incluir al menos una letra y un número.',
  })
  password!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(100, { message: 'El nombre es demasiado largo.' })
  firstName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @MaxLength(100, { message: 'Los apellidos son demasiado largos.' })
  lastName!: string;

  // Solo STUDENT o TEACHER: nadie se auto-registra como ADMIN.
  @IsIn([UserRole.STUDENT, UserRole.TEACHER], {
    message: 'El rol debe ser estudiante o profesor.',
  })
  role!: RegisterableRole;

  @IsOptional()
  @IsEnum(HearingLossLevel, { message: 'Nivel de hipoacusia no válido.' })
  hearingLossLevel?: HearingLossLevel;

  @IsOptional()
  @IsEnum(CommunicationPreference, { message: 'Preferencia de comunicación no válida.' })
  communicationPreference?: CommunicationPreference;
}
