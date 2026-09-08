import { UserStatus } from '@academia/types';

import { accountPending, accountRejected, accountSuspended } from '../auth/auth.errors';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * El access token es una foto de hasta 15 min: revalida el estado contra la
 * BD antes de una escritura (reservar, editar, cancelar, marcar asistencia).
 * Lectura ya autorizada nunca la paga — solo escritura.
 */
export async function assertCuentaActiva(prisma: PrismaService, userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });

  if (user?.status === UserStatus.SUSPENDED) throw accountSuspended();
  if (user?.status === UserStatus.PENDING) throw accountPending();
  if (user?.status === UserStatus.REJECTED) throw accountRejected();
}
