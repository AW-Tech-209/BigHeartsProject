import { ApiErrorCode } from '@academia/types';
import { describe, expect, it } from 'vitest';

import { ApiClientError } from '@/lib/api-error';
import { mensajeErrorReserva } from './mensaje-error-reserva';

describe('mensajeErrorReserva — un mensaje literal por código (AC2, T7)', () => {
  it.each([
    [ApiErrorCode.CLASSROOM_FULL, /ya no quedan cupos/i],
    [ApiErrorCode.CLASSROOM_NOT_BOOKABLE, /ya no admite reservas/i],
    [ApiErrorCode.BOOKING_ALREADY_EXISTS, /ya tienes una reserva/i],
    [ApiErrorCode.BOOKING_OVERLAP, /ya tienes otra clase reservada/i],
  ])('%s', (code, esperado) => {
    const error = new ApiClientError({ code, message: 'texto del servidor' }, 409);

    expect(mensajeErrorReserva(error)).toMatch(esperado);
  });

  it('nunca usa el texto crudo del servidor para los códigos conocidos', () => {
    const error = new ApiClientError(
      { code: ApiErrorCode.CLASSROOM_FULL, message: 'texto que no debería aparecer' },
      409,
    );

    expect(mensajeErrorReserva(error)).not.toContain('texto que no debería aparecer');
  });

  it('un error de red da un mensaje propio', () => {
    const error = new ApiClientError({ code: 'NETWORK_ERROR', message: 'x' });

    expect(mensajeErrorReserva(error)).toMatch(/no pudimos conectar/i);
  });

  it('un código desconocido usa el mensaje del servidor si lo trae', () => {
    const error = new ApiClientError({ code: 'ALGO_NUEVO', message: 'algo específico pasó' }, 500);

    expect(mensajeErrorReserva(error)).toBe('algo específico pasó');
  });

  it('algo que no es un ApiClientError da el mensaje genérico', () => {
    expect(mensajeErrorReserva(new Error('lo que sea'))).toMatch(/no pudimos reservar/i);
  });
});
