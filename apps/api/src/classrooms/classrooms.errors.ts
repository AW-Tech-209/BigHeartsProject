import { type ForbiddenException, NotFoundException } from '@nestjs/common';
import { ApiErrorCode, UserStatus } from '@academia/types';

import {
  accountPending,
  accountRejected,
  accountSuspended,
  insufficientRole,
} from '../auth/auth.errors';

/**
 * Fábricas de las excepciones de dominio de aulas.
 *
 * **Esta HU no añade ningún código nuevo al catálogo.** Los estados de cuenta ya
 * tienen los suyos —`ACCOUNT_PENDING`, `ACCOUNT_REJECTED`,
 * `ACCOUNT_SUSPENDED`—, dicen exactamente lo que bloquea, y el frontend ya sabe
 * distinguirlos desde el login. Inventar un `TEACHER_NOT_ACTIVE` habría
 * duplicado esa distinción en dos vocabularios que luego hay que mantener
 * sincronizados. Ver `contrato-api.md` §3: los códigos se añaden cuando dicen
 * algo que ninguno decía, no cuando cambia el endpoint que los emite.
 */

/**
 * El profesor del token ya no existe en la BD.
 *
 * Misma carrera que en `/users/me`: el access token vive 15 minutos y se
 * verifica solo por firma, así que sobrevive a que se borre la cuenta.
 */
export const teacherProfileNotFound = (): NotFoundException =>
  new NotFoundException({
    code: ApiErrorCode.USER_NOT_FOUND,
    message: 'No encontramos tu perfil. Inicia sesión de nuevo.',
  });

/**
 * Traduce el estado de la cuenta del profesor al 403 que le corresponde.
 *
 * Los tres mensajes son distintos porque los tres hechos son distintos, y el
 * microcopy de este producto es deliberadamente literal (D13): a un profesor
 * cuya solicitud fue rechazada no se le puede decir que su cuenta "está
 * suspendida", ni a uno que espera aprobación que "no tiene permiso".
 *
 * `ACTIVE` no aparece: quien llega aquí ya falló la comprobación. Si algún día
 * se añade un estado nuevo a `UserStatus`, esto lo bloquea por defecto en vez
 * de dejarlo pasar — que es la respuesta segura ante un estado desconocido.
 */
export const teacherNotActive = (status: UserStatus): ForbiddenException => {
  switch (status) {
    case UserStatus.PENDING:
      return accountPending();
    case UserStatus.REJECTED:
      return accountRejected();
    case UserStatus.SUSPENDED:
      return accountSuspended();
    default:
      return insufficientRole();
  }
};
