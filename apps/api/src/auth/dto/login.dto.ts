import type { LoginInput } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de `POST /auth/login`. Implementa `LoginInput` de @academia/types.
 *
 * A diferencia del registro, aquí NO se validan reglas de complejidad de la
 * contraseña: solo que venga. La comprobación real es contra el hash guardado;
 * imponer formato aquí solo daría pistas a un atacante y molestaría a usuarios
 * legítimos con contraseñas antiguas.
 */
export class LoginDto implements LoginInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password!: string;
}
