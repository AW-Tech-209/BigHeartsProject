import type { ResetPasswordInput } from '@academia/types';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * DTO de `POST /auth/reset-password` (HU-410). La regla de `password` es la
 * misma que la de `RegisterDto`: cambiar la contraseña no puede ser más laxo
 * que crearla.
 */
export class ResetPasswordDto implements ResetPasswordInput {
  @IsString()
  @IsNotEmpty({ message: 'El enlace de recuperación no es válido.' })
  token!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La contraseña debe incluir al menos una letra y un número.',
  })
  password!: string;
}
