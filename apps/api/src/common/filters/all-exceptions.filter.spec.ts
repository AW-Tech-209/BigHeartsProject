import { BadRequestException, ConflictException, type ArgumentsHost } from '@nestjs/common';
import { ApiErrorCode, type ApiResponse } from '@academia/types';
import { describe, expect, it, vi } from 'vitest';

import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * El filtro es el último tramo del contrato de errores: lo que no pase por aquí
 * no llega al frontend, por bien construida que esté la excepción.
 *
 * Se prueba sobre todo el reenvío de `details`, porque es una garantía de
 * producto y no una comodidad: sin él, `TEACHER_SCHEDULE_CONFLICT` llegaría
 * como un código pelado y el profesor tendría que buscar a mano con cuál de sus
 * clases chocó (HU-212, AC5).
 */

/** Un `ArgumentsHost` de Express falso que captura el cuerpo de la respuesta. */
function hostFalso() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, cuerpo: (): ApiResponse => json.mock.calls[0]?.[0] as ApiResponse };
}

/** Atrapa la excepción y devuelve el envelope de error que se serializó. */
function respuestaA(exception: unknown) {
  const { host, status, cuerpo } = hostFalso();
  new AllExceptionsFilter().catch(exception, host);

  const body = cuerpo();
  if (body.success) {
    throw new Error('El filtro serializó una respuesta de éxito.');
  }

  return { status: status.mock.calls[0]?.[0] as number, error: body.error };
}

describe('AllExceptionsFilter', () => {
  it('reenvía el `details` de una excepción de dominio tal y como se lanzó', () => {
    const detalles = {
      conflictoId: '55555555-5555-4555-8555-555555555555',
      conflictoTitulo: 'Conversación cotidiana',
      conflictoScheduledAt: '2027-08-12T18:00:00.000Z',
      conflictoDurationMinutes: 60,
    };

    const { status, error } = respuestaA(
      new ConflictException({
        code: ApiErrorCode.TEACHER_SCHEDULE_CONFLICT,
        message: 'Ya tienes «Conversación cotidiana» en ese horario.',
        details: detalles,
      }),
    );

    expect(status).toBe(409);
    expect(error.code).toBe(ApiErrorCode.TEACHER_SCHEDULE_CONFLICT);
    expect(error.details).toEqual(detalles);
  });

  it('mantiene la forma `details.fields` de los errores de validación', () => {
    const { error } = respuestaA(
      new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Revisa los campos.',
        fields: [{ field: 'title', message: 'Ponle un nombre a la clase.' }],
      }),
    );

    expect(error.details).toEqual({
      fields: [{ field: 'title', message: 'Ponle un nombre a la clase.' }],
    });
  });

  it('no inventa `details` cuando la excepción no lo trae', () => {
    const { error } = respuestaA(
      new ConflictException({ code: ApiErrorCode.CLASSROOM_FORBIDDEN, message: 'No es tuya.' }),
    );

    expect(error).not.toHaveProperty('details');
  });

  // Una excepción desconocida no puede filtrar nada de dentro: ni el mensaje ni
  // la traza salen al cliente.
  it('convierte cualquier otra excepción en un 500 genérico', () => {
    const { status, error } = respuestaA(new Error('la conexión se cayó en el pooler'));

    expect(status).toBe(500);
    expect(error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
    expect(error.message).not.toContain('pooler');
  });
});
