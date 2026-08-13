import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiErrorCode,
  type ApiError,
  type ApiResponse,
  type ValidationErrorDetail,
} from '@academia/types';
import type { Response } from 'express';

/**
 * Filtro global: convierte CUALQUIER excepción en el envelope de error
 * `ApiResponse` de @academia/types. Garantiza que el frontend siempre recibe
 * la misma forma (`{ success: false, error: { code, message, details }, ... }`)
 * pase lo que pase.
 *
 * Las excepciones desconocidas se registran completas en el log pero al cliente
 * solo se le devuelve un 500 genérico: nunca se filtran detalles internos.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error: ApiError = {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor.',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      error = this.toApiError(exception);
    } else {
      this.logger.error(
        'Excepción no controlada',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiResponse = { success: false, error, timestamp };
    response.status(status).json(body);
  }

  /** Normaliza el cuerpo de una HttpException al contrato `ApiError`. */
  private toApiError(exception: HttpException): ApiError {
    const raw = exception.getResponse();

    if (typeof raw === 'string') {
      return { code: statusToCode(exception.getStatus()), message: raw };
    }

    const obj = raw as Record<string, unknown>;

    const code = typeof obj.code === 'string' ? obj.code : statusToCode(exception.getStatus());

    // NestJS mete el mensaje como string o, en validaciones, como string[].
    const rawMessage = obj.message;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage)
          ? rawMessage.join(' ')
          : exception.message;

    const fields = Array.isArray(obj.fields) ? (obj.fields as ValidationErrorDetail[]) : undefined;

    return { code, message, ...(fields ? { details: { fields } } : {}) };
  }
}

/** Código estable a partir del status HTTP cuando la excepción no trae uno. */
function statusToCode(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.TOO_MANY_REQUESTS:
      return ApiErrorCode.TOO_MANY_REQUESTS;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}
