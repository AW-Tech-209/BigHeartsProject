import type { User as PrismaUser } from '@prisma/client';
import {
  type CommunicationPreference,
  type HearingLossLevel,
  type User,
  type UserRole,
  type UserStatus,
} from '@academia/types';

/**
 * Convierte una entidad `User` de Prisma en la vista pública `User` de
 * @academia/types.
 *
 * Aquí es donde, a propósito, se DESCARTA el campo `password`: nunca debe salir
 * de la base de datos hacia una respuesta. Los enums de Prisma y los de
 * @academia/types comparten los mismos valores string, de ahí los casts.
 */
export function toPublicUser(user: PrismaUser): User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    status: user.status as UserStatus,
    hearingLossLevel: user.hearingLossLevel as HearingLossLevel | null,
    communicationPreference: user.communicationPreference as CommunicationPreference | null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
