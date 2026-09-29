import {
  type CrearValoracionInput,
  ProblemaClase,
  SeguimientoClase,
  VALORACION_COMENTARIO_MAX,
} from '@academia/types';
import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo de `POST /bookings/:id/valoracion` (HU-515). La reserva sale de la ruta y el dueño, del token. */
export class CrearValoracionDto implements CrearValoracionInput {
  @IsEnum(SeguimientoClase, { message: 'Elige si pudiste seguir la clase: sí, a medias o no.' })
  seguimiento!: SeguimientoClase;

  @IsOptional()
  @IsArray({ message: 'Los problemas deben ser una lista.' })
  @ArrayUnique({ message: 'No repitas el mismo problema.' })
  @IsEnum(ProblemaClase, { each: true, message: 'Uno de los problemas no es válido.' })
  problemas?: ProblemaClase[];

  @IsOptional()
  @IsString({ message: 'El comentario debe ser texto.' })
  @MaxLength(VALORACION_COMENTARIO_MAX, {
    message: `El comentario admite hasta ${VALORACION_COMENTARIO_MAX} caracteres.`,
  })
  comentario?: string;
}
