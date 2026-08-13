import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { validationExceptionFactory } from './validation/validation-exception.factory';

/**
 * Piezas transversales globales de la API:
 *  - ValidationPipe: valida y transforma los DTOs (class-validator). `whitelist`
 *    + `forbidNonWhitelisted` descartan/rechazan campos no declarados (defensa
 *    contra mass-assignment).
 *  - ResponseInterceptor: envuelve las respuestas OK en el envelope de éxito.
 *  - AllExceptionsFilter: envuelve los errores en el envelope de error.
 *
 * Registrar estos providers con los tokens APP_* de Nest los hace globales sin
 * tener que configurarlos a mano en main.ts.
 */
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: validationExceptionFactory,
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class CommonModule {}
