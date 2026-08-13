import { BadRequestException } from '@nestjs/common';
import { ApiErrorCode, type ValidationErrorDetail } from '@academia/types';
import type { ValidationError } from 'class-validator';

/**
 * Convierte los errores de class-validator en una BadRequestException cuyo
 * cuerpo sigue el contrato acordado: `code: VALIDATION_ERROR` + una lista de
 * `{ field, message }`. El AllExceptionsFilter la traduce al envelope final.
 *
 * Se pasa como `exceptionFactory` del ValidationPipe global (ver CommonModule).
 */
export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    code: ApiErrorCode.VALIDATION_ERROR,
    message: 'Los datos enviados no son válidos.',
    fields: flattenValidationErrors(errors),
  });
}

/** Aplana los errores (incluidos los anidados) a una lista plana por campo. */
function flattenValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] {
  const details: ValidationErrorDetail[] = [];

  for (const error of errors) {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      // Tomamos el primer mensaje de restricción como el mensaje del campo.
      const [message] = Object.values(error.constraints);
      details.push({ field, message: message ?? 'Valor no válido.' });
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, field));
    }
  }

  return details;
}
