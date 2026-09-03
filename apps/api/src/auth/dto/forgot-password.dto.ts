import type { ForgotPasswordInput } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

/** DTO de `POST /auth/forgot-password` (HU-410). Implementa `ForgotPasswordInput`. */
export class ForgotPasswordDto implements ForgotPasswordInput {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;
}
