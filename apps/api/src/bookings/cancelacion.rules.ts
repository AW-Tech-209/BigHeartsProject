/**
 * ¿Todavía se puede cancelar una reserva de esta aula? (`reglas-reservas.md`
 * §2, HU-303 AC3). La usan `BookingsService` para autorizar y
 * `ClassroomsService` para pintar `myBookingCancelable` sin duplicar la regla.
 */
export function puedeCancelarse(
  scheduledAt: Date,
  ahora: Date,
  cancellationWindowMinutes: number,
): boolean {
  return ahora.getTime() < scheduledAt.getTime() - cancellationWindowMinutes * 60_000;
}
