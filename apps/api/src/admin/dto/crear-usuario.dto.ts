import { type CrearUsuarioInput, type RegisterableRole, UserRole } from '@academia/types';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CrearUsuarioDto implements CrearUsuarioInput {
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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El email no tiene un formato válido.' })
  email!: string;

  // Un admin no crea admins.
  @IsIn([UserRole.STUDENT, UserRole.TEACHER], {
    message: 'El rol debe ser estudiante o profesor.',
  })
  role!: RegisterableRole;
}
