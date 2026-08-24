import { type Classroom, ClassroomStatus } from '@academia/types';

/**
 * ¿Se puede editar o cancelar esta aula? Replica en el cliente la condición
 * de `assertEsEditable` del servicio (HU-202, AC3) **solo para decidir qué
 * pintar** — el servidor la vuelve a comprobar y es quien manda (§4.8).
 */
export function esAulaEditable(
  aula: Pick<Classroom, 'status' | 'scheduledAt'>,
  ahora: Date = new Date(),
): boolean {
  return aula.status !== ClassroomStatus.CANCELLED && new Date(aula.scheduledAt) > ahora;
}
