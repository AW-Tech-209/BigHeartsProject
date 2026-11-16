import { NotFoundException } from '@nestjs/common';
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
