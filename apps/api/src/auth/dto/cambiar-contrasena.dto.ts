import type { CambiarContrasenaInput } from '@academia/types';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** DTO de `POST /auth/cambiar-contrasena`. La `nueva` sigue la regla del registro. */
export class CambiarContrasenaDto implements CambiarContrasenaInput {
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu contraseña actual.' })
  @MaxLength(72)
  actual!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'La contraseña debe incluir al menos una letra y un número.',
  })
  nueva!: string;
}
