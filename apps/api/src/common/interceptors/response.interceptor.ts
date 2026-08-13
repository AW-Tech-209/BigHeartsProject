import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { ApiResponse } from '@academia/types';
import { map, type Observable } from 'rxjs';

/**
 * Envuelve el valor que devuelve cualquier controlador en el envelope de éxito
 * `ApiResponse<T>` de @academia/types. Así los controladores devuelven datos
 * "limpios" (p. ej. `{ user }`) y la forma de la respuesta es consistente en
 * toda la API sin repetir el envoltorio en cada endpoint.
 *
 * Los errores NO pasan por aquí: van al AllExceptionsFilter.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
