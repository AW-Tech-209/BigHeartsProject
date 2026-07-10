import { Module } from '@nestjs/common';

/**
 * Piezas transversales reutilizables por el resto de módulos: filtros de
 * excepción, interceptores, pipes, guards y decoradores propios.
 *
 * Se declara como módulo (y no como simple carpeta de utilidades) para poder
 * registrar aquí providers globales — p. ej. un filtro de excepciones que
 * normalice los errores al formato `ApiError` de @academia/types.
 *
 * TODO: filtros, interceptores y decoradores compartidos.
 */
@Module({})
export class CommonModule {}
