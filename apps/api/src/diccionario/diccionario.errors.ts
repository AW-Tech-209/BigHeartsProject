import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiErrorCode } from '@academia/types';

export const moduloNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.MODULE_NOT_FOUND,
    message: 'No encontramos ese módulo del diccionario.',
  });

export const moduloNoDisponible = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.MODULE_NOT_AVAILABLE,
    message: 'Este módulo llegará cuando el profesor entregue su material.',
  });

export const categoriaNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.CATEGORY_NOT_FOUND,
    message: 'No encontramos esa categoría del diccionario.',
  });

/** Igual para la que no existe que para la de la papelera, oculta o de un módulo próximo. */
export const entradaNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.ENTRY_NOT_FOUND,
    message: 'No encontramos esta palabra en el diccionario.',
  });

export const unidadNoEsDelModulo = (): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.UNIT_NOT_IN_MODULE,
    message: 'Esa unidad no pertenece al módulo elegido.',
  });

/** Un id sin forma de UUID equivale a «no existe». */
export const idDeEntrada = new ParseUUIDPipe({ exceptionFactory: () => entradaNotFound() });

export const archivoDemasiadoGrande = (maxBytes: number): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.FILE_TOO_LARGE,
    message: `El archivo pesa más de ${Math.round(maxBytes / 1024 / 1024) || 1} MB.`,
    details: { maxBytes },
  });

export const tipoDeArchivoNoPermitido = (permitidos: readonly string[]): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.FILE_TYPE_NOT_ALLOWED,
    message: 'Ese tipo de archivo no se admite.',
    details: { permitidos },
  });

export const videoDemasiadoLargo = (maxMs: number): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.VIDEO_TOO_LONG,
    message: `La seña dura más de ${maxMs / 1000} segundos.`,
    details: { maxMs },
  });

export const videoDemasiadoCorto = (minMs: number): BadRequestException =>
  new BadRequestException({
    code: ApiErrorCode.VIDEO_TOO_SHORT,
    message: `La seña dura menos de ${minMs / 1000} segundos.`,
    details: { minMs },
  });

export const subidaNoEncontrada = (): ConflictException =>
  new ConflictException({
    code: ApiErrorCode.UPLOAD_NOT_FOUND,
    message: 'El archivo no terminó de subir. Vuelve a intentarlo.',
  });

export const videoNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.VIDEO_NOT_FOUND,
    message: 'No encontramos esa subida. Puede que haya caducado.',
  });

export const idDeVideo = new ParseUUIDPipe({ exceptionFactory: () => videoNotFound() });
