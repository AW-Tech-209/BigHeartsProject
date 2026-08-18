import {
  CommunicationPreference,
  HearingLossLevel,
  type UpdateProfileInput,
} from '@academia/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Normaliza strings: recorta espacios. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * DTO de `PATCH /users/me`. Implementa `UpdateProfileInput` de @academia/types
 * (el contrato compartido) y le añade las reglas de class-validator. Los
 * mensajes están en español porque llegan al usuario.
 *
 * Lo que este DTO **no** declara es tan importante como lo que declara: el
 * ValidationPipe global va con `whitelist` + `forbidNonWhitelisted`, así que
 * cualquier campo ausente de aquí —`email`, `role`, `id`, `status`— hace que la
 * petición se rechace con `VALIDATION_ERROR` en vez de colarse hasta Prisma.
 * Es la primera de las dos barreras contra mass-assignment; la segunda está en
 * `UsersService.updateProfile`, que arma el `data` campo a campo.
 */
export class UpdateProfileDto implements UpdateProfileInput {
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

  // `@IsOptional()` deja pasar `undefined` y `null` sin validar, que es justo lo
  // que el contrato necesita: omitir la clave = "no la toques", mandar `null` =
  // "retira la preferencia". Un valor que no sea del enum sí falla.
  @IsOptional()
  @IsEnum(HearingLossLevel, { message: 'Nivel de hipoacusia no válido.' })
  hearingLossLevel?: HearingLossLevel | null;

  @IsOptional()
  @IsEnum(CommunicationPreference, { message: 'Preferencia de comunicación no válida.' })
  communicationPreference?: CommunicationPreference | null;
}
