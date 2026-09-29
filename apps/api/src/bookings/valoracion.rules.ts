import {
  BookingStatus,
  ProblemaClase,
  SeguimientoClase,
  VALORACION_MINIMO_RESPUESTAS,
  VALORACION_VENTANA_DIAS,
  type ValoracionAgregada,
} from '@academia/types';

const DIA_MS = 24 * 60 * 60_000;

/** Solo una reserva que llegó a ocurrir se valora: `CONFIRMED` sin marcar o `ATTENDED`. */
export function estadoValorable(status: string): boolean {
  return status === BookingStatus.CONFIRMED || status === BookingStatus.ATTENDED;
}

/** Desde el fin de la clase hasta `VALORACION_VENTANA_DIAS` días después. */
export function dentroDeVentanaDeValoracion(endsAt: Date, ahora: Date): boolean {
  const limite = endsAt.getTime() + VALORACION_VENTANA_DIAS * DIA_MS;
  return ahora.getTime() >= endsAt.getTime() && ahora.getTime() <= limite;
}

/** `puedeValorar` de una reserva ya cargada con su aula y su valoración. */
export function puedeValorarReserva(
  booking: { status: string; classroom: { endsAt: Date }; feedback: { id: string } | null },
  ahora: Date,
): boolean {
  return (
    booking.feedback === null &&
    estadoValorable(booking.status) &&
    dentroDeVentanaDeValoracion(booking.classroom.endsAt, ahora)
  );
}

/**
 * Agrega las respuestas de una clase (D47). `null` bajo el mínimo: con grupos
 * pequeños, mostrar el conteo delataría a quien respondió.
 */
export function agregarValoraciones(
  filas: { seguimiento: string; problemas: string[] }[],
): ValoracionAgregada | null {
  if (filas.length < VALORACION_MINIMO_RESPUESTAS) {
    return null;
  }

  const problemas = Object.fromEntries(
    Object.values(ProblemaClase).map((problema) => [problema, 0]),
  ) as Record<ProblemaClase, number>;

  for (const fila of filas) {
    for (const problema of fila.problemas) {
      problemas[problema as ProblemaClase] += 1;
    }
  }

  const cuenta = (valor: SeguimientoClase) =>
    filas.filter((fila) => fila.seguimiento === valor).length;

  return {
    respuestas: filas.length,
    si: cuenta(SeguimientoClase.SI),
    aMedias: cuenta(SeguimientoClase.A_MEDIAS),
    no: cuenta(SeguimientoClase.NO),
    problemas,
  };
}
